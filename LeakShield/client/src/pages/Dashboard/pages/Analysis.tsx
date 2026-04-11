import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { userAuth } from "../../../context/Auth";
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
  Activity,
  ShieldAlert
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
  CartesianGrid
} from "recharts";

const ACCENT_COLOR = "#0ea5a4"; // Primary Cyan

// Unified sleek card style matching the "SecureScan" dark UI exactly
const CARD_STYLE = "bg-[#0B1120] border border-[#1E293B] rounded-xl p-6 flex flex-col shadow-lg";

const Analysis2 = () => {
  const { user, company, refreshUser } = userAuth()!;
  
  useEffect(() => {
    refreshUser();
  }, []);

  // If neither present
  if (!user && !company) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-300 p-8">
        <div className="text-center bg-[#0B1120] border border-rose-500/20 p-8 rounded-2xl shadow-lg">
          <AlertTriangle className="mx-auto text-rose-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm text-slate-400">Please log in with a developer or company account.</p>
        </div>
      </div>
    );
  }

  const isDeveloper = !!user && user.userType === "developer";
  const isCompanyView = !!company && !user;

  // DEV stats
  const lastScan = user?.LastScanned ? new Date(user.LastScanned).toLocaleString() : null;
  const devVerified = user?.VerifiedRepositories ?? 0;
  const devTotal = user?.TotalRepositories ?? 1;
  const riskScore = Math.round((devVerified / Math.max(devTotal, 1)) * 100);

  // Determine risk color based on score
  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  // COMPANY derived values (lightweight)
  const employees = company?.employees ?? [];
  const totalEmployees = company?.totalEmployees ?? employees.length;
  const developersCount = company?.developersCount ?? employees.filter(e => e.userType === "developer").length;
  const vulnerableCount = company?.vulnerableCount ?? employees.filter(e => e.Status === "Vulnerable").length;
  const loggedInCount = company?.loggedInCount ?? employees.filter(e => !!e.LastScanned).length;

  // aggregate repos and small datasets for charts
  const { totalRepos, verifiedRepos, unverifiedRepos, trendData } = useMemo(() => {
    let t = 0, v = 0, un = 0;
    const dateMap: Record<string, number> = {};
    employees.forEach(emp => {
      const te = Number(emp.TotalRepositories ?? 0);
      const ve = Number(emp.VerifiedRepositories ?? 0);
      const ue = Number(emp.UnverifiedRepositories ?? 0);
      t += te; v += ve; un += ue;
      if (emp.LastScanned) {
        const key = new Date(emp.LastScanned).toISOString().slice(0,10);
        dateMap[key] = (dateMap[key] || 0) + 1;
      }
    });
    const trend = Object.keys(dateMap).sort().map(d => ({ date: d, scans: dateMap[d] }));
    return { totalRepos: t, verifiedRepos: v, unverifiedRepos: un, trendData: trend };
  }, [employees]);

  // PIE dataset
  const pieData = [
    { name: "Verified", value: verifiedRepos },
    { name: "Unverified", value: unverifiedRepos }
  ];
  const PIE_COLORS = [ACCENT_COLOR, "#151B28"]; // Cyan and Dark Panel background

  return (
    // Wrapper uses w-full h-full so it inherits the ultra-dark background from MainDashBoardLayout
    <div className="w-full h-full flex flex-col gap-8 text-slate-200 font-sans">
      
      {/* --- Header --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide flex items-center gap-3">
            {isCompanyView ? company.companyName : user.email.split("@")[0]}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {isDeveloper ? "Developer overview & quick tools" : "Organization summary & security snapshot"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/Dashboard2/settings" 
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-[#1E293B] bg-[#0B1120] text-slate-300 hover:bg-[#151B28] transition-all text-sm font-semibold"
          >
            <Settings size={16} />
            Settings
          </Link>
          <Link 
            to={isDeveloper ? "/Dashboard2/scans" : "/Dashboard2/reports"} 
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-900 transition-colors text-sm font-bold shadow-lg shadow-cyan-500/10"
          >
            {isDeveloper ? "Run Scan" : "View Full Report"}
            <ChevronRight size={16} className="text-slate-800" />
          </Link>
        </div>
      </header>

      {/* --- Quick Stat Cards --- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {isDeveloper ? (
          <>
            {/* Dev: Risk Score */}
            <div className={CARD_STYLE}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Security Score</p>
                <div className="bg-[#151B28] p-1.5 rounded-lg border border-[#1E293B]">
                  <ShieldCheck size={18} className={getRiskColor(riskScore)} />
                </div>
              </div>
              <div className={`text-5xl font-black ${getRiskColor(riskScore)} mb-2`}>{riskScore}<span className="text-2xl text-slate-500">%</span></div>
              <div className="text-xs text-slate-500 mt-auto">
                Last scan: {lastScan ?? "Never"}
              </div>
            </div>

            {/* Dev: Total Repos */}
            <div className={CARD_STYLE}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Total Repositories</p>
                <div className="bg-[#151B28] p-1.5 rounded-lg border border-[#1E293B]">
                  <FolderGit2 size={18} className="text-blue-400" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2">{devTotal}</div>
            </div>

            {/* Dev: Verified */}
            <div className={CARD_STYLE}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Verified Repos</p>
                <div className="bg-[#151B28] p-1.5 rounded-lg border border-[#1E293B]">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2">{devVerified}</div>
            </div>
          </>
        ) : (
          <>
            {/* Company: Total Employees */}
            <div className={CARD_STYLE}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Total Employees</p>
                <div className="bg-[#151B28] p-1.5 rounded-lg border border-[#1E293B]">
                  <Users size={18} className="text-blue-400" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2">{totalEmployees}</div>
              <div className="text-xs text-slate-500 mt-auto">
                <span className="text-slate-300 font-medium">{developersCount}</span> active developers
              </div>
            </div>

            {/* Company: Total Repos */}
            <div className={CARD_STYLE}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Total Repositories</p>
                <div className="bg-[#151B28] p-1.5 rounded-lg border border-[#1E293B]">
                  <FolderGit2 size={18} className="text-indigo-400" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2">{totalRepos}</div>
              <div className="text-xs text-slate-500 mt-auto">
                Across <span className="text-slate-300 font-medium">{loggedInCount}</span> scanned users
              </div>
            </div>

            {/* Company: Vulnerable Accounts */}
            <div className={CARD_STYLE}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Vulnerable Accounts</p>
                <div className="bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20">
                  <ShieldAlert size={18} className="text-rose-400" />
                </div>
              </div>
              <div className="text-4xl font-bold text-rose-500 mb-2">{vulnerableCount}</div>
              <div className="text-xs text-rose-500/70 mt-auto">
                Immediate attention recommended
              </div>
            </div>

            {/* Company: Codebase Status */}
            <div className={CARD_STYLE}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Codebase Status</p>
                <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                </div>
              </div>
              <div className="flex gap-6 items-center mt-2">
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{verifiedRepos}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Verified</div>
                </div>
                <div className="w-px h-8 bg-[#1E293B]"></div>
                <div>
                  <div className="text-2xl font-bold text-slate-400">{unverifiedRepos}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Unverified</div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* --- Charts & Actions Row --- */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
        {/* Verification Pie Chart */}
        <div className={`${CARD_STYLE} flex flex-col`}>
          <h2 className="text-sm font-bold text-white tracking-wider mb-6 flex items-center gap-2">
            📊 Verification Ratio
          </h2>
          <div className="flex-1 w-full min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={isDeveloper ? [
                    { name: "Verified", value: devVerified },
                    { name: "Unverified", value: Math.max(devTotal - devVerified, 0) }
                  ] : pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={50}
                  paddingAngle={5}
                  stroke="none"
                >
                  {(isDeveloper ? [
                    { name: "Verified", value: devVerified },
                    { name: "Unverified", value: Math.max(devTotal - devVerified, 0) }
                  ] : pieData).map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip 
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1E293B', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-6 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400" /> Verified
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#151B28] border border-[#1E293B]" /> Unverified
            </div>
          </div>
        </div>

        {/* Scan Activity Line Chart */}
        <div className={`${CARD_STYLE} flex flex-col`}>
          <h2 className="text-sm font-bold text-white tracking-wider mb-6 flex items-center gap-2">
            📈 Scan Activity (7 Days)
          </h2>
          <div className="flex-1 w-full min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(() => {
                if (!isCompanyView) {
                  return user && user.LastScanned ? [{ date: new Date(user.LastScanned).toISOString().slice(5,10), scans: 1 }] : [];
                }
                const counts: Record<string, number> = {};
                employees.forEach(emp => {
                  if (emp.LastScanned) {
                    const d = new Date(emp.LastScanned).toISOString().slice(5,10); 
                    counts[d] = (counts[d] || 0) + 1;
                  }
                });
                return Object.keys(counts).sort().slice(-7).map(d => ({ date: d, scans: counts[d] }));
              })()}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                <ReTooltip 
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1E293B', borderRadius: '8px', color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="scans" 
                  stroke={ACCENT_COLOR} 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#0B1120', stroke: ACCENT_COLOR, strokeWidth: 2 }} 
                  activeDot={{ r: 6, fill: ACCENT_COLOR }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Links */}
        <div className={CARD_STYLE}>
          <h2 className="text-sm font-bold text-white tracking-wider mb-6 flex items-center gap-2">
            🔗 Quick Links
          </h2>
          <div className="flex flex-col gap-3">
            {isDeveloper ? (
              <>
                <Link to="/Dashboard2/scans" className="group flex items-center justify-between p-3.5 rounded-lg bg-[#151B28] border border-[#1E293B] hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-[#0B1120] border border-[#1E293B] group-hover:border-cyan-500/30 transition-colors">
                      <GitBranch size={16} className="text-slate-400 group-hover:text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">Run New Scan</div>
                      <div className="text-[11px] text-slate-500">Analyze your repositories</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-400 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link to="/Dashboard2/reports" className="group flex items-center justify-between p-3.5 rounded-lg bg-[#151B28] border border-[#1E293B] hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-[#0B1120] border border-[#1E293B] group-hover:border-cyan-500/30 transition-colors">
                      <BarChart3 size={16} className="text-slate-400 group-hover:text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">View My Reports</div>
                      <div className="text-[11px] text-slate-500">Detailed vulnerability data</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-400 transition-transform group-hover:translate-x-1" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/Dashboard2/manegEmploy" className="group flex items-center justify-between p-3.5 rounded-lg bg-[#151B28] border border-[#1E293B] hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-[#0B1120] border border-[#1E293B] group-hover:border-cyan-500/30 transition-colors">
                      <Users size={16} className="text-slate-400 group-hover:text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">Manage Team</div>
                      <div className="text-[11px] text-slate-500">Add or remove employees</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-400 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link to="/Dashboard2/reports" className="group flex items-center justify-between p-3.5 rounded-lg bg-[#151B28] border border-[#1E293B] hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-[#0B1120] border border-[#1E293B] group-hover:border-cyan-500/30 transition-colors">
                      <BarChart3 size={16} className="text-slate-400 group-hover:text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">Executive Report</div>
                      <div className="text-[11px] text-slate-500">Exportable security summary</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-400 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link to="/Dashboard2/vulnerabilities" className="group flex items-center justify-between p-3.5 rounded-lg bg-[#151B28] border border-[#1E293B] hover:border-rose-500/30 hover:bg-rose-950/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-[#0B1120] border border-[#1E293B] group-hover:border-rose-500/30 transition-colors">
                      <ShieldAlert size={16} className="text-slate-400 group-hover:text-rose-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200 group-hover:text-rose-400 transition-colors">Active Threats</div>
                      <div className="text-[11px] text-slate-500">Review critical vulnerabilities</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-rose-400 transition-transform group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Analysis2;