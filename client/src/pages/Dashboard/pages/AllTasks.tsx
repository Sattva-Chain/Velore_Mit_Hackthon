import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CalendarDays, ExternalLink, Mail, ShieldAlert } from "lucide-react";
import { userAuth } from "../../../context/Auth";

const API_BASE_URL = "http://localhost:3000";

type TaskRecord = {
  _id: string;
  title: string;
  description?: string | null;
  remediationRecommendation?: string | null;
  repoName?: string | null;
  repoUrl?: string | null;
  branch?: string | null;
  filePath?: string | null;
  lineNumber?: number | null;
  secretType?: string | null;
  severity?: string | null;
  assignedToEmail?: string | null;
  assignedByName?: string | null;
  assignedByUserId?: { name?: string | null; email?: string | null } | null;
  assignedToUserId?: { name?: string | null; email?: string | null } | null;
  asanaTaskUrl?: string | null;
  asanaSyncStatus?: string | null;
  asanaAssignmentResolved?: boolean;
  asanaAssignmentMessage?: string | null;
  dueDate?: string | null;
  status?: string | null;
  computedStatus?: string | null;
  emailNotificationSent?: boolean;
  emailNotificationError?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  vulnerabilityId?: {
    _id: string;
    repoName?: string | null;
    repoUrl?: string | null;
    branch?: string | null;
    file?: string | null;
    line?: number | null;
    author?: string | null;
    authorEmail?: string | null;
    severity?: string | null;
    status?: string | null;
    secretType?: string | null;
  } | null;
};

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "DONE"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : status === "IN_PROGRESS"
        ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
        : status === "OVERDUE"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
          : status === "FAILED"
            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
            : "border-zinc-700 bg-zinc-900 text-zinc-300";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${tone}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function AllTasks() {
  const { token, organization, role } = userAuth()!;
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    repo: "",
    branch: "",
    assignee: "",
    status: "",
    severity: "",
  });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) return;
      try {
        const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
        const { data } = await axios.get(`${API_BASE_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        if (!active) return;
        setTasks(data?.tasks || []);
      } catch {
        if (!active) return;
        setTasks([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [token, filters]);

  const summary = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        const effectiveStatus = task.computedStatus || task.status || "OPEN";
        acc.total += 1;
        if (effectiveStatus === "OPEN") acc.open += 1;
        if (effectiveStatus === "IN_PROGRESS") acc.inProgress += 1;
        if (effectiveStatus === "DONE") acc.done += 1;
        if (effectiveStatus === "OVERDUE") acc.overdue += 1;
        return acc;
      },
      { total: 0, open: 0, inProgress: 0, done: 0, overdue: 0 }
    );
  }, [tasks]);

  const handleStatusUpdate = async (taskId: string, nextStatus: string) => {
    if (!token) return;
    setStatusBusy(true);
    try {
      const { data } = await axios.patch(
        `${API_BASE_URL}/api/tasks/${taskId}/status`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data?.success) return;

      setTasks((current) =>
        current.map((task) => (task._id === taskId ? { ...task, ...data.task } : task))
      );
      setSelectedTask((current) => (current && current._id === taskId ? { ...current, ...data.task } : current));
    } finally {
      setStatusBusy(false);
    }
  };

  const repos = [...new Set(tasks.map((task) => task.repoName).filter(Boolean))];
  const branches = [...new Set(tasks.map((task) => task.branch).filter(Boolean))];
  const assignees = [...new Set(tasks.map((task) => task.assignedToEmail).filter(Boolean))];

  return (
    <div className="w-full flex flex-col gap-8 text-zinc-200 pb-4">
      <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">All Tasks</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track remediation assignments, Asana sync state, email delivery, and repo context in one place.
          </p>
        </div>
        <div className="text-sm text-zinc-500">
          {organization?.name || (role === "SOLO_DEVELOPER" ? "Personal workspace" : "SecureScan")}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Tasks", value: summary.total, tone: "text-zinc-100" },
          { label: "Open", value: summary.open, tone: "text-blue-300" },
          { label: "In Progress", value: summary.inProgress, tone: "text-amber-300" },
          { label: "Overdue", value: summary.overdue, tone: "text-rose-300" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{card.label}</p>
            <p className={`mt-3 text-2xl font-semibold ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search task, repo, file"
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
          />
          <select
            value={filters.repo}
            onChange={(event) => setFilters((prev) => ({ ...prev, repo: event.target.value }))}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm"
          >
            <option value="">All repositories</option>
            {repos.map((repo) => (
              <option key={repo} value={repo || ""}>
                {repo}
              </option>
            ))}
          </select>
          <select
            value={filters.branch}
            onChange={(event) => setFilters((prev) => ({ ...prev, branch: event.target.value }))}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm"
          >
            <option value="">All branches</option>
            {branches.map((branch) => (
              <option key={branch} value={branch || ""}>
                {branch}
              </option>
            ))}
          </select>
          <select
            value={filters.assignee}
            onChange={(event) => setFilters((prev) => ({ ...prev, assignee: event.target.value }))}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm"
          >
            <option value="">All assignees</option>
            {assignees.map((assignee) => (
              <option key={assignee} value={assignee || ""}>
                {assignee}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
            <option value="FAILED">Failed</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          <select
            value={filters.severity}
            onChange={(event) => setFilters((prev) => ({ ...prev, severity: event.target.value }))}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm"
          >
            <option value="">All severities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        {tasks.map((task) => {
          const effectiveStatus = task.computedStatus || task.status || "OPEN";
          return (
            <article
              key={task._id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-[0_0_0_1px_rgba(24,24,27,0.25)] transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="grid gap-5 xl:grid-cols-[2fr_1fr_auto] xl:items-start">
                <div className="space-y-4 min-w-0">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-zinc-100 break-words">{task.title}</h3>
                      <p className="mt-2 text-xs text-zinc-500">
                        {task.secretType || "Secret"} | {task.severity || "MEDIUM"}
                      </p>
                    </div>
                    <StatusBadge status={effectiveStatus} />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Repository</p>
                      <p className="mt-2 text-sm text-zinc-100 break-words">{task.repoName || task.repoUrl || "Unknown"}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Branch</p>
                      <p className="mt-2 text-sm text-zinc-100">{task.branch || "N/A"}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Assignee</p>
                      <p className="mt-2 text-sm text-zinc-100 break-all">{task.assignedToEmail || "Unassigned"}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Due Date</p>
                      <p className="mt-2 text-sm text-zinc-100">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Asana</p>
                    <p className="mt-2 text-sm text-zinc-100">{task.asanaSyncStatus || "PENDING"}</p>
                    {task.asanaTaskUrl && (
                      <a
                        href={task.asanaTaskUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-300 transition hover:text-blue-200"
                      >
                        <ExternalLink size={12} />
                        Open task
                      </a>
                    )}
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Source</p>
                    <p className="mt-2 text-sm text-zinc-100">{task.vulnerabilityId?.secretType || task.secretType || "Secret"}</p>
                    <p className="mt-1 text-xs text-zinc-500 break-all">
                      {task.vulnerabilityId?.file || task.filePath || "N/A"}:{task.vulnerabilityId?.line ?? task.lineNumber ?? "N/A"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Created By</p>
                    <p className="mt-2 text-sm text-zinc-100 break-all">{task.assignedByUserId?.email || task.assignedByName || "SecureScan"}</p>
                  </div>
                </div>

                <div className="flex xl:justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedTask(task)}
                    className="inline-flex h-fit whitespace-nowrap rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {!tasks.length && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-8 text-center text-sm text-zinc-500">
            No remediation tasks match the current filters.
          </div>
        )}
      </section>

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-7xl max-h-[92vh] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-6 py-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-blue-300/70">Task detail</p>
                <h2 className="mt-2 text-xl font-semibold text-zinc-100">{selectedTask.title}</h2>
                <p className="mt-1 text-sm text-zinc-500">Review vulnerability context, assignee, delivery state, and Asana linkage.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100"
              >
                Close
              </button>
            </div>

            <div className="max-h-[calc(92vh-88px)] space-y-5 overflow-y-auto px-6 py-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 xl:col-span-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Repository</p>
                  <p className="mt-2 text-sm text-zinc-100 break-words">{selectedTask.repoName || selectedTask.repoUrl || "Unknown"}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Branch</p>
                  <p className="mt-2 text-sm text-zinc-100">{selectedTask.branch || "N/A"}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Severity</p>
                  <p className="mt-2 text-sm text-zinc-100">{selectedTask.severity || "MEDIUM"}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Status</p>
                  <div className="mt-2"><StatusBadge status={selectedTask.computedStatus || selectedTask.status || "OPEN"} /></div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Due Date</p>
                  <p className="mt-2 text-sm text-zinc-100">{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Task context</p>
                    <div className="mt-4 grid gap-3 text-sm text-zinc-300 md:grid-cols-2">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 md:col-span-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">File</p>
                        <p className="mt-1 break-all text-zinc-100">{selectedTask.filePath || "N/A"}</p>
                        <p className="mt-2 text-xs text-zinc-500">Line {selectedTask.lineNumber ?? "N/A"} | {selectedTask.secretType || "Secret"} | {selectedTask.severity || "MEDIUM"}</p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Assignee</p>
                        <p className="mt-1 break-all text-zinc-100">{selectedTask.assignedToEmail || "Unassigned"}</p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Created By</p>
                        <p className="mt-1 break-all text-zinc-100">{selectedTask.assignedByUserId?.email || selectedTask.assignedByName || "SecureScan"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Description</p>
                      <div className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap break-words pr-1 text-sm text-zinc-300">
                        {selectedTask.description || "No description provided."}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Remediation guidance</p>
                      <div className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap break-words pr-1 text-sm text-zinc-300">
                        {selectedTask.remediationRecommendation || "Rotate the exposed secret and move it into secure configuration."}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Update status</p>
                    <select
                      value={selectedTask.status || "OPEN"}
                      onChange={(event) => handleStatusUpdate(selectedTask._id, event.target.value)}
                      disabled={statusBusy}
                      className="mt-4 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-blue-500"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                      <option value="FAILED">Failed</option>
                      <option value="OVERDUE">Overdue</option>
                    </select>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Delivery status</p>
                    <div className="mt-4 grid gap-3">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-sm text-zinc-300">
                        <div className="flex items-start gap-3">
                          <ShieldAlert size={16} className="mt-0.5 text-blue-400" />
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-100">Asana sync</p>
                            <p className="mt-1 text-zinc-500">{selectedTask.asanaSyncStatus || "PENDING"}</p>
                            {selectedTask.asanaAssignmentMessage && (
                              <p className="mt-1 break-words text-xs text-zinc-500">{selectedTask.asanaAssignmentMessage}</p>
                            )}
                            {selectedTask.asanaTaskUrl && (
                              <a
                                href={selectedTask.asanaTaskUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-blue-300 transition hover:text-blue-200"
                              >
                                <ExternalLink size={13} />
                                Open Asana task
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-sm text-zinc-300">
                        <div className="flex items-start gap-3">
                          <Mail size={16} className="mt-0.5 text-emerald-400" />
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-100">Email notification</p>
                            <p className="mt-1 break-words text-zinc-500">
                              {selectedTask.emailNotificationSent ? "Sent successfully." : selectedTask.emailNotificationError || "Not sent."}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-sm text-zinc-300">
                        <div className="flex items-start gap-3">
                          <CalendarDays size={16} className="mt-0.5 text-zinc-400" />
                          <div>
                            <p className="font-medium text-zinc-100">Timeline</p>
                            <p className="mt-1 text-zinc-500">Created {selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleString() : "N/A"}</p>
                            <p className="mt-1 text-zinc-500">Updated {selectedTask.updatedAt ? new Date(selectedTask.updatedAt).toLocaleString() : "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
