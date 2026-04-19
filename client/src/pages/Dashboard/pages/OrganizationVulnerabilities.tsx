import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CheckCircle2, Sparkles } from "lucide-react";
import { userAuth } from "../../../context/Auth";
import AssignTaskModal, { type AssignableVulnerability } from "../components/AssignTaskModal";

const API_BASE_URL = "http://localhost:3000";

type VulnerabilityRecord = AssignableVulnerability & {
  commitTime?: string | null;
  status?: string | null;
  fixedByEmail?: string | null;
  fixedAt?: string | null;
};

function statusTone(status?: string | null) {
  const value = String(status || "OPEN").toUpperCase();
  if (value === "FIXED") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (value === "IGNORED") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-zinc-700 bg-zinc-900 text-zinc-300";
}

export default function OrganizationVulnerabilities() {
  const { token, organization, user, role } = userAuth()!;
  const [records, setRecords] = useState<VulnerabilityRecord[]>([]);
  const [repos, setRepos] = useState<{ _id: string; repoName?: string; total: number; open: number }[]>([]);
  const [branches, setBranches] = useState<{ _id: string; total: number; open: number }[]>([]);
  const [developers, setDevelopers] = useState<{ _id: string; author?: string; total: number; open: number }[]>([]);
  const [filters, setFilters] = useState({
    repo: "",
    branch: "",
    developerEmail: "",
    status: "",
    severity: "",
  });
  const [taskModalRecord, setTaskModalRecord] = useState<VulnerabilityRecord | null>(null);
  const [createdTaskByVulnerabilityId, setCreatedTaskByVulnerabilityId] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      try {
        if (organization?._id) {
          const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
          const [recordsRes, reposRes, branchesRes, devsRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/organizations/${organization._id}/vulnerabilities`, { headers, params }),
            axios.get(`${API_BASE_URL}/api/organizations/${organization._id}/repos`, { headers }),
            axios.get(`${API_BASE_URL}/api/organizations/${organization._id}/branches`, { headers }),
            axios.get(`${API_BASE_URL}/api/organizations/${organization._id}/developers`, { headers }),
          ]);
          if (!active) return;
          setRecords(recordsRes.data?.vulnerabilities || []);
          setRepos(reposRes.data?.repos || []);
          setBranches(branchesRes.data?.branches || []);
          setDevelopers(devsRes.data?.developers || []);
          return;
        }

        const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
        const { data } = await axios.get(`${API_BASE_URL}/api/auth/vulnerabilities`, { headers, params });
        if (!active) return;
        setRecords(data?.vulnerabilities || []);
      } catch {
        if (!active) return;
        setRecords([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [token, organization?._id, filters]);

  const heading = useMemo(() => {
    if (role === "SOLO_DEVELOPER") return "My Vulnerabilities";
    if (role === "EMPLOYEE") return "Assigned & Visible Vulnerabilities";
    return "Organization Vulnerabilities";
  }, [role]);

  const canAssignTasks = role === "ORG_OWNER" || role === "SOLO_DEVELOPER";

  return (
    <div className="w-full flex flex-col gap-8 text-zinc-200 pb-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">{heading}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Filter by repository, branch, developer, status, and severity without changing the existing scan pipeline.
          </p>
        </div>
        <div className="text-sm text-zinc-500">
          {organization?.name || user?.email || "SecureScan"}
        </div>
      </header>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <select
            value={filters.repo}
            onChange={(event) => setFilters((prev) => ({ ...prev, repo: event.target.value }))}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm"
          >
            <option value="">All repositories</option>
            {repos.map((repo) => (
              <option key={repo._id || repo.repoName} value={repo._id}>
                {repo.repoName || repo._id}
              </option>
            ))}
          </select>

          <select
            value={filters.branch}
            onChange={(event) => setFilters((prev) => ({ ...prev, branch: event.target.value }))}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm"
          >
            <option value="">All branches</option>
            {branches.map((branch) => (
              <option key={branch._id || "branch"} value={branch._id || ""}>
                {branch._id || "Unknown"}
              </option>
            ))}
          </select>

          <select
            value={filters.developerEmail}
            onChange={(event) => setFilters((prev) => ({ ...prev, developerEmail: event.target.value }))}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm"
          >
            <option value="">All developers</option>
            {developers.map((developer) => (
              <option key={developer._id || developer.author} value={developer._id || ""}>
                {developer.author || developer._id || "Unknown"}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="FIXED">Fixed</option>
            <option value="IGNORED">Ignored</option>
          </select>

          <select
            value={filters.severity}
            onChange={(event) => setFilters((prev) => ({ ...prev, severity: event.target.value }))}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm"
          >
            <option value="">All severities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        {records.map((row) => (
          <article
            key={row._id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-[0_0_0_1px_rgba(24,24,27,0.25)] transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr_auto] xl:items-start">
              <div className="space-y-4 min-w-0">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-zinc-100 break-words">
                      {row.repoName || row.repoUrl || "Unknown repository"}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500 break-all">{row.file || "N/A"}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusTone(row.status)}`}>
                    {row.status || "OPEN"}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Branch</p>
                    <p className="mt-2 text-sm text-zinc-100">{row.branch || "N/A"}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Line</p>
                    <p className="mt-2 text-sm text-zinc-100">{row.line ?? "N/A"}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Type</p>
                    <p className="mt-2 text-sm text-blue-300">{row.secretType || "Secret"}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Severity</p>
                    <p className="mt-2 text-sm text-zinc-100">{row.severity || "MEDIUM"}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Author</p>
                  <p className="mt-2 text-sm text-zinc-100">{row.author || "Unknown"}</p>
                  <p className="mt-1 break-all font-mono text-xs text-zinc-500">{row.authorEmail || "N/A"}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Commit Time</p>
                  <p className="mt-2 text-sm text-zinc-100">
                    {row.commitTime ? new Date(row.commitTime).toLocaleString() : "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Patched By</p>
                  <p className="mt-2 break-words text-sm text-zinc-100">
                    {row.status === "FIXED"
                      ? row.fixedByEmail
                        ? `${row.fixedByEmail}${row.fixedAt ? ` · ${new Date(row.fixedAt).toLocaleString()}` : ""}`
                        : row.fixedAt
                          ? new Date(row.fixedAt).toLocaleString()
                          : "Recorded"
                      : "—"}
                  </p>
                </div>
              </div>

              {canAssignTasks && (
                <div className="flex xl:justify-end">
                  {createdTaskByVulnerabilityId[row._id] ? (
                    <span className="inline-flex h-fit items-center gap-2 whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      <CheckCircle2 size={13} />
                      Task created
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTaskModalRecord(row)}
                      className="inline-flex h-fit items-center gap-2 whitespace-nowrap rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs font-semibold text-blue-200 transition hover:border-blue-400/40 hover:bg-blue-500/15 hover:text-white"
                    >
                      <Sparkles size={14} />
                      Assign Task
                    </button>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}

        {!records.length && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-8 text-center text-sm text-zinc-500">
            No vulnerability records match the current filters.
          </div>
        )}
      </section>

      {taskModalRecord && token && (
        <AssignTaskModal
          open={Boolean(taskModalRecord)}
          token={token}
          vulnerability={taskModalRecord}
          onClose={() => setTaskModalRecord(null)}
          onCreated={(task) =>
            setCreatedTaskByVulnerabilityId((current) => ({
              ...current,
              [taskModalRecord._id]: task._id,
            }))
          }
        />
      )}
    </div>
  );
}
