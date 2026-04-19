function normalizeDateInput(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatAsanaDate(value) {
  const normalized = normalizeDateInput(value);
  if (!normalized) return null;
  return normalized.toISOString().slice(0, 10);
}

function computeDefaultTaskDueDate() {
  const dueDays = Number(process.env.REMEDIATION_TASK_DUE_DAYS || 2);
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + (Number.isFinite(dueDays) ? dueDays : 2));
  return base;
}

function isAsanaConfigured() {
  return Boolean(
    String(process.env.ASANA_ACCESS_TOKEN || "").trim() &&
      String(process.env.ASANA_WORKSPACE_GID || "").trim() &&
      String(process.env.ASANA_PROJECT_GID || "").trim()
  );
}

function buildAsanaHeaders() {
  return {
    Authorization: `Bearer ${String(process.env.ASANA_ACCESS_TOKEN || "").trim()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { response, payload };
}

async function listWorkspaceUsers(workspaceGid) {
  const users = [];
  let offset = null;
  let pageCount = 0;

  while (pageCount < 10) {
    const query = new URLSearchParams({
      limit: "100",
      opt_fields: "gid,name,email",
    });

    if (offset) {
      query.set("offset", offset);
    }

    const { response, payload } = await fetchJson(
      `https://app.asana.com/api/1.0/workspaces/${workspaceGid}/users?${query.toString()}`,
      {
        method: "GET",
        headers: buildAsanaHeaders(),
      }
    );

    if (!response.ok) {
      return [];
    }

    if (Array.isArray(payload?.data)) {
      users.push(...payload.data);
    }

    offset = payload?.next_page?.offset || null;
    if (!offset) break;
    pageCount += 1;
  }

  return users;
}

async function getCurrentAsanaUser() {
  const { response, payload } = await fetchJson(
    "https://app.asana.com/api/1.0/users/me?opt_fields=gid,name,email",
    {
      method: "GET",
      headers: buildAsanaHeaders(),
    }
  );

  if (!response.ok) return null;
  return payload?.data || null;
}

async function resolveAsanaAssignee(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !isAsanaConfigured()) {
    return null;
  }

  try {
    const workspaceGid = String(process.env.ASANA_WORKSPACE_GID || "").trim();
    const users = await listWorkspaceUsers(workspaceGid);
    let match = users.find(
      (user) => String(user?.email || "").trim().toLowerCase() === normalizedEmail
    );

    if (!match) {
      const me = await getCurrentAsanaUser();
      if (String(me?.email || "").trim().toLowerCase() === normalizedEmail) {
        match = me;
      }
    }

    return match
      ? {
          gid: match.gid || null,
          email: match.email || null,
          name: match.name || null,
        }
      : null;
  } catch {
    return null;
  }
}

async function createAsanaRemediationTask(payload) {
  if (!isAsanaConfigured()) {
    return {
      created: false,
      skipped: true,
      syncStatus: "SKIPPED",
      message:
        "Asana is not configured in the running backend. Save ASANA_ACCESS_TOKEN, ASANA_WORKSPACE_GID, and ASANA_PROJECT_GID in back/.env, then restart the backend.",
      gid: null,
      url: null,
    };
  }

  const workspaceGid = String(process.env.ASANA_WORKSPACE_GID || "").trim();
  const projectGid = String(process.env.ASANA_PROJECT_GID || "").trim();
  const assignee = payload.assigneeGid
    ? { gid: payload.assigneeGid, email: payload.assigneeEmail || null, name: null }
    : await resolveAsanaAssignee(payload.assigneeEmail);
  const assigneeGid = assignee?.gid || null;
  const dueOn = formatAsanaDate(payload.dueDate || computeDefaultTaskDueDate());

  const requestBody = {
    data: {
      name: payload.name,
      notes: payload.notes,
      workspace: workspaceGid,
      projects: [projectGid],
      due_on: dueOn,
    },
  };

  if (assigneeGid) {
    requestBody.data.assignee = assigneeGid;
  }

  try {
    const { response, payload: body } = await fetchJson("https://app.asana.com/api/1.0/tasks", {
      method: "POST",
      headers: buildAsanaHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const message =
        body?.errors?.map((item) => item.message).filter(Boolean).join("; ") ||
        "Unable to create remediation task in Asana.";

      return {
        created: false,
        skipped: false,
        syncStatus: "FAILED",
        message,
        gid: null,
        url: null,
        assigneeGid,
        assigneeResolved: Boolean(assigneeGid),
        assigneeEmail: assignee?.email || payload.assigneeEmail || null,
        assigneeName: assignee?.name || null,
      };
    }

    const task = body?.data || {};
    return {
      created: true,
      skipped: false,
      syncStatus: "SYNCED",
      message: "Task created in Asana.",
      gid: task.gid || null,
      url:
        task.permalink_url ||
        (task.gid ? `https://app.asana.com/0/${projectGid}/${task.gid}` : null),
      assigneeGid,
      assigneeResolved: Boolean(assigneeGid),
      assigneeEmail: assignee?.email || payload.assigneeEmail || null,
      assigneeName: assignee?.name || null,
      assignmentMessage: assigneeGid
        ? `Assigned in Asana to ${assignee?.name || assignee?.email || "matched user"}.`
        : payload.assigneeEmail
          ? `Task created in Asana, but ${payload.assigneeEmail} is not available as an assignable member in the configured Asana workspace or project.`
          : "Task created in Asana without an assignee.",
    };
  } catch (error) {
    return {
      created: false,
      skipped: false,
      syncStatus: "FAILED",
      message: String(error?.message || "Unable to reach Asana."),
      gid: null,
      url: null,
      assigneeGid,
      assigneeResolved: Boolean(assigneeGid),
      assigneeEmail: assignee?.email || payload.assigneeEmail || null,
      assigneeName: assignee?.name || null,
    };
  }
}

module.exports = {
  computeDefaultTaskDueDate,
  createAsanaRemediationTask,
  isAsanaConfigured,
};
