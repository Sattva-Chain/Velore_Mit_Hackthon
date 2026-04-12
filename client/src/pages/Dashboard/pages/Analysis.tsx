import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { userAuth, type Repository } from "../../../context/Auth";
import {
  ShieldCheck,
  AlertTriangle,
  GitBranch,
  Users,
  BarChart3,
  ChevronRight,
  Settings,
  FolderGit2,
  CheckCircle2,
  ShieldAlert,
  ChartPie,
  LineChart as LineChartIcon,
  Link2,
  RefreshCw,
  Clock,
  ExternalLink,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const ACCENT = "#2563eb";
const ACCENT_MUTED = "#3f3f46";

const CARD_BASE =
  "bg-zinc-900/80 border border-zinc-800 rounded-lg p-5 flex flex-col shadow-sm transition-all duration-200 ease-out";
const CARD = `${CARD_BASE} hover:border-zinc-700 hover:shadow-md hover:-translate-y-0.5`;

type OrgMember = {
  email?: string;
  LastScanned?: string;
  Status?: string;
  userType?: string;
  TotalRepositories?: number;
  VerifiedRepositories?: number;
  UnverifiedRepositories?: number;
  _id?: string;
};

function buildScanBuckets7d(sources: (string | undefined | null)[]) {
  const days: { date: string; scans: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ date: key, scans: 0 });
  }
  sources.forEach((raw) => {
    if (!raw) return;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return;
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const row = days.find((x) => x.date === key);
    if (row) row.scans += 1;
  });
  return days;
}

function buildOrgScanActivity7d(employees: OrgMember[]) {
  const dates: string[] = [];
  employees.forEach((emp) => {
    if (emp.LastScanned) dates.push(emp.LastScanned);
  });
  return buildScanBuckets7d(dates);
}

function DashboardSkeleton() {
  return (
    <div className="w-full flex flex-col gap-8 animate-pulse" aria-busy="true">
      <div className="h-16 rounded-lg bg-zinc-800/80 border border-zinc-800" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((k) => (
          <div key={k} className="h-28 rounded-lg bg-zinc-800/60 border border-zinc-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((k) => (
          <div key={k} className="h-72 rounded-lg bg-zinc-800/50 border border-zinc-800" />
        ))}
      </div>
    </div>
  );
}

const Analysis2 = () => {
  const { user, company, refreshUser, repo, authReady, token, sessionHydrated } = userAuth()!;
  const [refreshing, setRefreshing] = useState(false);

  /** Any logged-in staff user (not org-only session) uses the developer-style dashboard */
  const isDeveloper = Boolean(user);
  const isCompanyView = !!company && !user;
  const employees = (company?.employees ?? []) as OrgMember[];
  const ds = company?.dashboardStats;

  const fallbackTotals = useMemo(() => {
    let t = 0;
    let v = 0;
    let un = 0;
    employees.forEach((emp) => {
      t += Number(emp.TotalRepositories ?? 0);
      v += Number(emp.VerifiedRepositories ?? 0);
      un += Number(emp.UnverifiedRepositories ?? 0);
    });
    return { totalRepos: t, verifiedRepos: v, unverifiedRepos: un };
  }, [employees]);

  const totalRepos = ds?.totalRepositories ?? fallbackTotals.totalRepos;
  const verifiedRepos = ds?.verifiedRepositories ?? fallbackTotals.verifiedRepos;
  const unverifiedRepos = ds?.unverifiedRepositories ?? fallbackTotals.unverifiedRepos;

  const devVerified = user?.VerifiedRepositories ?? 0;
  const devTotal = user?.TotalRepositories ?? 0;

  const lineData = useMemo(() => {
    if (isCompanyView) {
      return buildOrgScanActivity7d(employees);
    }
    const repoDates = (repo ?? []).map((r) => r.LastScanned);
    if (user?.LastScanned) repoDates.push(user.LastScanned);
    return buildScanBuckets7d(repoDates);
  }, [isCompanyView, employees, repo, user?.LastScanned]);

  const devPie = useMemo(
    () => [
      { name: "Verified", value: devVerified },
      { name: "Unverified", value: Math.max(devTotal - devVerified, 0) },
    ],
    [devVerified, devTotal]
  );

  const orgPie = useMemo(
    () => [
      { name: "Verified", value: verifiedRepos },
      { name: "Unverified", value: unverifiedRepos },
    ],
    [verifiedRepos, unverifiedRepos]
  );

  const pieSlices = isDeveloper ? devPie : orgPie;
  const pieTotal = pieSlices.reduce((s, x) => s + x.value, 0);

  const recentRepos = useMemo(() => {
    const list = [...(repo ?? [])] as Repository[];
    return list
      .filter((r) => r.gitUrl)
      .sort((a, b) => {
        const ta = a.LastScanned ? new Date(a.LastScanned).getTime() : 0;
        const tb = b.LastScanned ? new Date(b.LastScanned).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 6);
  }, [repo]);

  const orgActivityRows = useMemo(() => {
    return [...employees]
      .sort((a, b) => {
        const ta = a.LastScanned ? new Date(a.LastScanned).getTime() : 0;
        const tb = b.LastScanned ? new Date(b.LastScanned).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 8);
  }, [employees]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } finally {
      setRefreshing(false);
    }
  };

  if (!sessionHydrated) {
    return <DashboardSkeleton />;
  }

  if (!token) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center text-zinc-300 p-8">
        <div className="text-center bg-zinc-900 border border-zinc-800 p-8 rounded-lg max-w-md">
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">Sign in required</h2>
          <p className="text-sm text-zinc-500 mb-6">Your session is not available on this device.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (!user && !company) {
    if (!authReady) {
      return <DashboardSkeleton />;
    }
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center text-zinc-300 p-8">
        <div className="text-center bg-zinc-900 border border-zinc-800 p-8 rounded-lg max-w-md">
          <AlertTriangle className="mx-auto text-amber-500 mb-4" size={40} />
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">Session invalid</h2>
          <p className="text-sm text-zinc-500 mb-6">We could not load your account. Try signing in again.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-600 text-zinc-200 hover:bg-zinc-800 text-sm"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  const lastScan = user?.LastScanned ? new Date(user.LastScanned).toLocaleString() : null;
  const riskScore = Math.round((devVerified / Math.max(devTotal, 1)) * 100);

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-400";
  };

  const totalEmployees = Number(company?.totalEmployees ?? employees.length) || employees.length;
  const developersCount =
    company?.developersCount ?? employees.filter((e) => e.userType === "developer").length;
  const vulnerableCount =
    company?.vulnerableCount ??
    ds?.vulnerableAccounts ??
    employees.filter((e) => e.Status === "Vulnerable").length;
  const loggedInCount =
    company?.loggedInCount ??
    ds?.scannedMembersCount ??
    employees.filter((e) => !!e.LastScanned).length;

  const pageTitle = isCompanyView
    ? company!.companyName?.trim() || "Organization"
    : user!.name?.trim() || user!.email.split("@")[0];

  const tooltipStyle = {
    backgroundColor: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "6px",
    fontSize: "12px",
  };

  const statusBadge = (s?: string) => {
    if (s === "Vulnerable")
      return "bg-red-500/15 text-red-300 border-red-500/25";
    if (s === "Safe") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";
    return "bg-zinc-800 text-zinc-400 border-zinc-700";
  };

  return (
    <div className="w-full flex flex-col gap-8 text-zinc-200 pb-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isDeveloper
              ? "Live metrics from your account and stored repository scans."
              : "Aggregated from your team’s user records and repository collection."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link
            to="/Dashboard2/settings"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-sm font-medium transition-all active:scale-[0.98]"
          >
            <Settings size={16} />
            Settings
          </Link>
          <Link
            to={isDeveloper ? "/Dashboard2/scans" : "/Dashboard2/reports"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-sm shadow-blue-900/20 active:scale-[0.98]"
          >
            {isDeveloper ? "Run scan" : "Full report"}
            <ChevronRight size={16} />
          </Link>
        </div>
      </header>

      <section
        className={`grid grid-cols-1 sm:grid-cols-2 gap-4 w-full ${isDeveloper ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}
      >
        {isDeveloper ? (
          <>
            <div className={CARD}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Security score</p>
                <ShieldCheck size={18} className={getRiskColor(riskScore)} />
              </div>
              <div className={`text-4xl font-semibold tabular-nums ${getRiskColor(riskScore)}`}>
                {riskScore}
                <span className="text-lg text-zinc-500 font-normal">%</span>
              </div>
              <p className="text-xs text-zinc-500 mt-3">Last activity: {lastScan ?? "None recorded"}</p>
            </div>

            <div className={CARD}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Repositories</p>
                <FolderGit2 size={18} className="text-zinc-400" />
              </div>
              <div className="text-3xl font-semibold text-zinc-100 tabular-nums">{devTotal}</div>
              <p className="text-xs text-zinc-500 mt-3">Rows in your scan history</p>
            </div>

            <div className={CARD}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Clean scans</p>
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <div className="text-3xl font-semibold text-zinc-100 tabular-nums">{devVerified}</div>
              <p className="text-xs text-zinc-500 mt-3">Repositories marked Safe</p>
            </div>
          </>
        ) : (
          <>
            <div className={CARD}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Members</p>
                <Users size={18} className="text-zinc-400" />
              </div>
              <div className="text-3xl font-semibold text-zinc-100 tabular-nums">{totalEmployees}</div>
              <p className="text-xs text-zinc-500 mt-3">
                <span className="text-zinc-400">{developersCount}</span> developers
              </p>
            </div>

            <div className={CARD}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Repo records</p>
                <FolderGit2 size={18} className="text-zinc-400" />
              </div>
              <div className="text-3xl font-semibold text-zinc-100 tabular-nums">{totalRepos}</div>
              <p className="text-xs text-zinc-500 mt-3">
                <span className="text-zinc-400">{loggedInCount}</span> members with at least one scan
              </p>
            </div>

            <div className={CARD}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">At risk</p>
                <ShieldAlert size={18} className="text-red-400" />
              </div>
              <div className="text-3xl font-semibold text-red-400 tabular-nums">{vulnerableCount}</div>
              <p className="text-xs text-red-400/80 mt-3">Members with a vulnerable repo</p>
            </div>

            <div className={CARD}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Verification</p>
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <div className="flex gap-6 items-center mt-1">
                <div>
                  <div className="text-2xl font-semibold text-emerald-500 tabular-nums">{verifiedRepos}</div>
                  <div className="text-[11px] text-zinc-500 uppercase">Verified index</div>
                </div>
                <div className="w-px h-10 bg-zinc-800" />
                <div>
                  <div className="text-2xl font-semibold text-zinc-400 tabular-nums">{unverifiedRepos}</div>
                  <div className="text-[11px] text-zinc-500 uppercase">Unverified index</div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
        <div className={`${CARD} min-h-[280px]`}>
          <h2 className="text-sm font-medium text-zinc-200 mb-4 flex items-center gap-2">
            <ChartPie size={16} className="text-zinc-500" />
            Verification mix
          </h2>
          <div className="flex-1 w-full min-h-[200px] flex flex-col">
            {pieTotal === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 rounded-md bg-zinc-950/50 border border-dashed border-zinc-800">
                <p className="text-sm text-zinc-400">No repository data yet</p>
                <p className="text-xs text-zinc-600 mt-2 max-w-[220px]">
                  Data appears after developers run scans and results are saved to the API.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieSlices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={72}
                    innerRadius={48}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {pieSlices.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={idx === 0 ? ACCENT : ACCENT_MUTED} />
                    ))}
                  </Pie>
                  <ReTooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {pieTotal > 0 && (
              <div className="mt-4 flex justify-center gap-6 text-xs text-zinc-500">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Verified
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-zinc-600" /> Unverified
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={`${CARD} min-h-[280px]`}>
          <h2 className="text-sm font-medium text-zinc-200 mb-4 flex items-center gap-2">
            <LineChartIcon size={16} className="text-zinc-500" />
            Scan activity (7 days)
          </h2>
          <div className="flex-1 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  allowDecimals={false}
                  width={28}
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReTooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="scans"
                  stroke={ACCENT}
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#18181b", stroke: ACCENT, strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: ACCENT }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            Each point counts how many repo scans finished that day (from stored timestamps).
          </p>
        </div>

        <div className={CARD}>
          <h2 className="text-sm font-medium text-zinc-200 mb-4 flex items-center gap-2">
            <Link2 size={16} className="text-zinc-500" />
            Shortcuts
          </h2>
          <div className="flex flex-col gap-2">
            {isDeveloper ? (
              <>
                <Link
                  to="/Dashboard2/scans"
                  className="group flex items-center justify-between p-3 rounded-md bg-zinc-950/50 border border-zinc-800 hover:border-blue-600/40 hover:bg-zinc-800/40 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GitBranch size={16} className="text-zinc-500 shrink-0 group-hover:text-blue-400 transition-colors" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-200">New scan</div>
                      <div className="text-xs text-zinc-500 truncate">Remote or archive</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/Dashboard2/reports"
                  className="group flex items-center justify-between p-3 rounded-md bg-zinc-950/50 border border-zinc-800 hover:border-blue-600/40 hover:bg-zinc-800/40 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BarChart3 size={16} className="text-zinc-500 shrink-0 group-hover:text-blue-400 transition-colors" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-200">Reports</div>
                      <div className="text-xs text-zinc-500 truncate">History and exports</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/Dashboard2/manegEmploy"
                  className="group flex items-center justify-between p-3 rounded-md bg-zinc-950/50 border border-zinc-800 hover:border-blue-600/40 hover:bg-zinc-800/40 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Users size={16} className="text-zinc-500 shrink-0 group-hover:text-blue-400 transition-colors" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-200">Team</div>
                      <div className="text-xs text-zinc-500 truncate">Members and access</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/Dashboard2/reports"
                  className="group flex items-center justify-between p-3 rounded-md bg-zinc-950/50 border border-zinc-800 hover:border-blue-600/40 hover:bg-zinc-800/40 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BarChart3 size={16} className="text-zinc-500 shrink-0 group-hover:text-blue-400 transition-colors" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-200">Executive report</div>
                      <div className="text-xs text-zinc-500 truncate">Organization summary</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/Dashboard2/reports"
                  className="group flex items-center justify-between p-3 rounded-md bg-zinc-950/50 border border-zinc-800 hover:border-red-900/50 hover:bg-red-950/20 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ShieldAlert size={16} className="text-zinc-500 shrink-0 group-hover:text-red-400 transition-colors" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-200 group-hover:text-red-200">Risk review</div>
                      <div className="text-xs text-zinc-500 truncate">Drill into vulnerable accounts</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Live activity — real API data */}
      <section className={`${CARD_BASE} border-zinc-800 p-0 overflow-hidden`}>
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <Clock size={17} className="text-zinc-500" />
            <h2 className="text-sm font-medium text-zinc-200">Recent activity</h2>
          </div>
          <span className="text-xs text-zinc-500">Updated when you press Refresh</span>
        </div>
        <div className="p-4 max-h-[320px] overflow-y-auto custom-scrollbar">
          {isDeveloper ? (
            recentRepos.length === 0 ? (
              <p className="text-sm text-zinc-500 py-6 text-center">
                No scanned repositories yet.{" "}
                <Link to="/Dashboard2/scans" className="text-blue-400 hover:underline">
                  Run a scan
                </Link>{" "}
                to populate this list.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentRepos.map((r) => (
                  <li
                    key={r._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-zinc-800/80 bg-zinc-950/40 px-4 py-3 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-200 truncate font-medium" title={r.gitUrl}>
                        {r.gitUrl.replace(/^https?:\/\//, "").split("/").slice(0, 3).join("/")}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {r.LastScanned
                          ? `Last scan ${new Date(r.LastScanned).toLocaleString()}`
                          : "No timestamp"}
                        {" · "}
                        <span className={r.Status === "Vulnerable" ? "text-red-400" : "text-zinc-400"}>
                          {r.Status ?? "Unknown"}
                        </span>
                      </p>
                    </div>
                    <Link
                      to="/Dashboard2/scans"
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 shrink-0"
                    >
                      Open scans <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : orgActivityRows.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6 text-center">No team members loaded.</p>
          ) : (
            <ul className="space-y-2">
              {orgActivityRows.map((m) => (
                <li
                  key={m._id ?? m.email}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-zinc-800/80 bg-zinc-950/40 px-4 py-3 hover:border-zinc-700 transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-200 font-medium truncate">{m.email ?? "Member"}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {m.LastScanned
                        ? `Last scan ${new Date(m.LastScanned).toLocaleString()}`
                        : "No scans yet"}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md border shrink-0 ${statusBadge(m.Status)}`}
                  >
                    {m.Status ?? "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default Analysis2;
