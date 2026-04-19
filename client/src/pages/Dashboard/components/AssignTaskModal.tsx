import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AlertTriangle, CalendarDays, CheckCircle2, Loader2, Mail, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:3000";

export type AssignableVulnerability = {
  _id: string;
  repoName?: string | null;
  repoUrl?: string | null;
  branch?: string | null;
  file?: string | null;
  line?: number | null;
  secretType?: string | null;
  severity?: string | null;
  author?: string | null;
  authorEmail?: string | null;
  status?: string | null;
};

type CreatedTaskInfo = {
  _id: string;
  title: string;
  status: string;
  computedStatus?: string;
};

type TaskCreateResponse = {
  success?: boolean;
  message?: string;
  warnings?: string[];
  task?: CreatedTaskInfo;
  asana?: {
    created?: boolean;
    skipped?: boolean;
    syncStatus?: string;
    message?: string;
    assigneeResolved?: boolean;
    assigneeEmail?: string | null;
    assigneeName?: string | null;
    assignmentMessage?: string;
  };
  email?: {
    delivered?: boolean;
    message?: string;
  };
};

type Props = {
  open: boolean;
  token: string;
  vulnerability: AssignableVulnerability | null;
  onClose: () => void;
  onCreated?: (task: CreatedTaskInfo) => void;
};

function defaultDueDateValue() {
  const next = new Date();
  next.setDate(next.getDate() + 2);
  return next.toISOString().slice(0, 10);
}

export default function AssignTaskModal({ open, token, vulnerability, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDateValue());
  const [note, setNote] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [createInAsana, setCreateInAsana] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !vulnerability) return;

    const repoName = vulnerability.repoName || vulnerability.repoUrl || "repository";
    const secretType = vulnerability.secretType || "secret";
    const filePath = vulnerability.file || "the affected file";

    setTitle(`[SecureScan] Remediate exposed ${secretType} in ${repoName}`);
    setAssigneeEmail(vulnerability.authorEmail || "");
    setDueDate(defaultDueDateValue());
    setNote("");
    setRecommendation(
      `Rotate the exposed ${secretType}, remove it from ${filePath}, and replace it with an environment variable or secret manager reference.`
    );
    setSendEmail(true);
    setCreateInAsana(true);
  }, [open, vulnerability]);

  const developerHint = useMemo(() => {
    if (!vulnerability?.authorEmail) {
      return "Developer email was not detected for this finding. You can still create the task and assign an email manually.";
    }

    return `Prefilled from commit metadata: ${vulnerability.authorEmail}`;
  }, [vulnerability]);

  const asanaHelperText = useMemo(() => {
    if (!assigneeEmail) {
      return "Add a developer email to create the task in Asana and assign it once a workspace user is matched.";
    }

    return `SecureScan will try to match ${assigneeEmail} to a real Asana workspace member before assigning the task.`;
  }, [assigneeEmail]);

  if (!open || !vulnerability) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setBusy(true);
    try {
      const { data } = await axios.post<TaskCreateResponse>(
        `${API_BASE_URL}/api/tasks/create`,
        {
          vulnerabilityId: vulnerability._id,
          title,
          assignedToEmail: assigneeEmail,
          dueDate,
          note,
          remediationRecommendation: recommendation,
          sendEmail,
          createInAsana,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.success) {
        const warnings = Array.isArray(data.warnings) ? data.warnings.filter(Boolean) : [];
        const asanaCreated = Boolean(data.asana?.created);
        const asanaAssigned = Boolean(data.asana?.assigneeResolved);
        const emailDelivered = Boolean(data.email?.delivered);

        if (asanaCreated && asanaAssigned && emailDelivered) {
          toast.success(`Asana task assigned to ${data.asana?.assigneeName || data.asana?.assigneeEmail || assigneeEmail || "developer"}.`);
        } else if (asanaCreated && asanaAssigned) {
          toast.success(`Asana task assigned to ${data.asana?.assigneeName || data.asana?.assigneeEmail || assigneeEmail || "developer"}.`);
        } else if (asanaCreated) {
          toast.error(data.asana?.assignmentMessage || "Task created in Asana, but it could not be assigned.");
        } else if (data.asana?.message === "Asana is not configured in the running backend. Save ASANA_ACCESS_TOKEN, ASANA_WORKSPACE_GID, and ASANA_PROJECT_GID in back/.env, then restart the backend.") {
          toast.error("The backend process is still running without Asana config. Restart the backend after saving back/.env.");
        } else if (warnings.length) {
          toast.error(warnings[0]);
        } else {
          toast.success(data?.message || "Remediation task created.");
        }

        if (data.task) {
          onCreated?.(data.task);
        }
        onClose();
        return;
      }

      toast.error(data?.message || "Unable to create remediation task.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to create remediation task.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 px-4 py-4 backdrop-blur-sm">
      <div className="w-full max-w-[88rem] max-h-[92vh] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-6 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-blue-300/70">Create remediation task</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-zinc-100">Assign Task</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-200">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  <span className="h-2 w-2 rounded-full bg-pink-400" />
                </span>
                Asana Ready
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Create and assign an Asana remediation task without changing the existing vulnerability workflow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid max-h-[calc(92vh-92px)] gap-5 overflow-y-auto px-6 py-6 2xl:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-5">
            <div className="grid gap-4 2xl:grid-cols-[1.55fr_0.9fr_0.8fr]">
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">Task title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-blue-500"
                  placeholder="Task title"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">Assignee email</span>
                <input
                  value={assigneeEmail}
                  onChange={(event) => setAssigneeEmail(event.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-blue-500"
                  placeholder="developer@company.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">Due date</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-blue-500"
                />
              </label>
            </div>

            <div className="grid gap-3 text-xs text-zinc-500 2xl:grid-cols-2">
              <span className="flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-3">
                <Mail size={14} className="mt-0.5 text-zinc-600" />
                <span>{developerHint}</span>
              </span>
              <span className="flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-3">
                <CalendarDays size={14} className="mt-0.5 text-zinc-600" />
                <span>Due date defaults to your remediation SLA if left unchanged.</span>
              </span>
            </div>

            <div className="grid gap-4 2xl:grid-cols-[1.08fr_0.92fr]">
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">Remediation recommendation</span>
                <textarea
                  value={recommendation}
                  onChange={(event) => setRecommendation(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">Additional note</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-blue-500"
                  placeholder="Optional note for the developer"
                />
              </label>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Vulnerability context</p>
              <div className="mt-4 grid gap-3 text-sm text-zinc-300">
                <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Repository</p>
                    <p className="mt-1 font-medium text-zinc-100">{vulnerability.repoName || vulnerability.repoUrl || "Unknown repository"}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Branch</p>
                    <p className="mt-1 text-zinc-100">{vulnerability.branch || "N/A"}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Severity</p>
                    <p className="mt-1 text-zinc-100">{vulnerability.severity || "MEDIUM"}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">File</p>
                  <p className="mt-1 break-all text-zinc-100">{vulnerability.file || "N/A"}</p>
                  <p className="mt-2 text-xs text-zinc-500">Line {vulnerability.line ?? "N/A"} | {vulnerability.secretType || "Secret"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Delivery options</p>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <label className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={createInAsana}
                    onChange={(event) => setCreateInAsana(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-blue-500"
                  />
                  <span>
                    <span className="flex items-center gap-2 font-medium text-zinc-100">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-400" />
                        <span className="h-2 w-2 rounded-full bg-orange-400" />
                        <span className="h-2 w-2 rounded-full bg-pink-400" />
                      </span>
                      Assign in Asana
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">{asanaHelperText}</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(event) => setSendEmail(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-blue-500"
                  />
                  <span>
                    <span className="flex items-center gap-2 font-medium text-zinc-100">
                      <Mail size={14} className="text-emerald-400" />
                      Send notification email
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">Sends the developer a premium notification with repo, file, line, due date, remediation note, and Asana task link.</span>
                  </span>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="mt-0.5 text-blue-300" />
                <p>
                  For direct Asana assignment, the developer email here must match a real member inside the Asana workspace configured on the backend. If it does not match, the task is still created but stays unassigned in Asana.
                </p>
              </div>
            </div>

            {!vulnerability.authorEmail && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="mt-0.5 text-amber-300" />
                  <p>The developer email is missing on this finding. You can still create the remediation task and update the assignee manually.</p>
                </div>
              </div>
            )}
          </div>

          <div className="xl:col-span-2 flex items-center justify-end gap-3 border-t border-zinc-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {busy ? "Creating task..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
