"use client";
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  ShieldAlert,
  CheckCircle,
  BarChart2,
  GitBranch,
  Clock,
  User as UserIcon,
  Building2,
  Mail,
  Globe,
  FolderGit2,
  XCircle,
} from "lucide-react";
import { userAuth } from "../../../context/Auth";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export interface ICompany {
  _id: string;
  companyName: string;
  CompanyURL: string;
  emailId: string;
}

export interface IUser {
  _id?: string;
  email: string;
  role: string;
  companyId?: ICompany;
}

const CARD_STYLE =
  "p-4 rounded-xl shadow-sm border border-slate-700 bg-gradient-to-br from-[#071229] to-[#08162a]";

const EmployedLogs: React.FC = () => {
  const [user, setUser] = useState<IUser | null>(null);
  const { setRepo, repo,refreshUser } = userAuth()!;
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [repoSecrets, setRepoSecrets] = useState<any[]>([]);

  const { id } = useParams();

  const getEmploy = async () => {
    try {
      const { data } = await axios.post("http://localhost:3000/api/getlogEmploy", { id });
      setUser(data.datas);
      setRepo(data.repos);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getEmploy();
  }, [id]);

  const repoStats = useMemo(() => {
    const total = repo?.length || 0;
    const safe = repo?.filter((r) => r.Status === "Safe")?.length || 0;
    const vulnerable = repo?.filter((r) => r.Status === "Vulnerable")?.length || 0;
    return { total, safe, vulnerable };
  }, [repo]);

  const handleRepoClick = (r: any) => {
    setSelectedRepo(r);
    if (r.vulnerabilities) {
      const secretsFlat = Object.values(r.vulnerabilities).flat();
      setRepoSecrets(secretsFlat);
    } else {
      setRepoSecrets([]);
    }
  };

  return (
    <div className="flex bg-[#0f172a] min-h-screen text-white p-6">
      <div className="flex-1 max-w-5xl mx-auto space-y-10">
        <h1 className="text-4xl font-bold text-blue-400 mb-8">Employee Report & Logs</h1>

        {user ? (
          <>
            {/* User Information */}
            <div className="bg-[#1e293b] p-6 rounded-2xl shadow-xl border border-[#334155]">
              <div className="flex items-center gap-4">
                <div className="bg-blue-700 p-3 rounded-full">
                  <UserIcon size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{user.email}</h2>
                  <p className="text-gray-400 text-sm">{user.role}</p>
                </div>
              </div>

              {/* Repo Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <StatCard icon={<FolderGit2 size={26} />} label="Total Repositories" count={repoStats.total} />
                <StatCard icon={<CheckCircle size={26} />} label="Safe" count={repoStats.safe} />
                <StatCard icon={<ShieldAlert size={26} />} label="Vulnerable" count={repoStats.vulnerable} />
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">🏢 Company Details</h3>
              <DetailItem icon={<Building2 size={16} />} text={user.companyId?.companyName || "Not Assigned"} />
              <DetailItem icon={<Mail size={16} />} text={user.companyId?.emailId || "No Email"} />
              <a
                href={user.companyId?.CompanyURL || "#"}
                target="_blank"
                className="flex items-center gap-2 mt-2 text-blue-300 hover:underline"
              >
                <Globe size={16} /> Visit Website
              </a>
            </div>

            {/* Repo List */}
            {repo && repo.length > 0 ? (
              <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                  <BarChart2 size={18} /> Repository Scan Reports
                </h3>
                <div className="space-y-4">
                  {repo.map((item: any, i: number) => (
                    <RepoCard key={i} repo={item} onClick={() => handleRepoClick(item)} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">🔍 No repositories found for this employee.</p>
            )}
          </>
        ) : (
          <p className="text-gray-300 animate-pulse">Loading Employee Data...</p>
        )}
      </div>

      {/* Repo Modal */}
      {selectedRepo && (
        <RepoModal repo={selectedRepo} secrets={repoSecrets} onClose={() => setSelectedRepo(null)} />
      )}
    </div>
  );
};

/* Components */
const StatCard = ({ icon, label, count }: any) => (
  <div className="bg-[#0f172a] p-4 rounded-xl border border-blue-800/40 text-center hover:scale-105 transition-all">
    <div className="mx-auto mb-1">{icon}</div>
    <p className="text-gray-400 text-sm">{label}</p>
    <p className="text-2xl font-bold">{count}</p>
  </div>
);

const DetailItem = ({ icon, text }: any) => (
  <p className="flex items-center gap-2 text-gray-400 py-1">{icon} {text}</p>
);

const RepoCard = ({ repo, onClick }: any) => (
  <div
    onClick={onClick}
    className="p-4 bg-[#0f172a] rounded-lg border border-[#334155] cursor-pointer hover:bg-blue-900/20 hover:scale-[1.02] transition"
  >
    <p className="font-medium text-blue-300 truncate">{repo.gitUrl}</p>
    <div className="flex justify-between text-xs mt-2 text-gray-400">
      <span className="flex items-center gap-1"><GitBranch size={14} /> {repo.Branch || "N/A"}</span>
      <span className="flex items-center gap-1"><Clock size={14} /> {repo.LastScanned || "Not Scanned"}</span>
      <span className={`font-semibold ${repo.Status === "Vulnerable" ? "text-red-400" : "text-green-400"}`}>
        {repo.Status}
      </span>
    </div>
  </div>
);

const RepoModal = ({ repo, secrets, onClose }: any) => {
  const messages: { text: string; type?: "info" | "success" | "warning" | "error" }[] =
    repo.messages || [{ text: "No notifications available.", type: "info" }];

  const getMessageStyle = (type: string | undefined) => {
    switch (type) {
      case "success":
        return { bg: "bg-green-900", icon: "✅", text: "text-green-300" };
      case "warning":
        return { bg: "bg-yellow-900", icon: "⚠️", text: "text-yellow-300" };
      case "error":
        return { bg: "bg-red-900", icon: "❌", text: "text-red-300" };
      default:
        return { bg: "bg-blue-900", icon: "ℹ️", text: "text-blue-300" };
    }
  };

  const secretsPieData = {
    labels: Array.from(new Set(secrets.map((s: any) => s.type))),
    datasets: [
      {
        data: Array.from(new Set(secrets.map((s: any) => s.type))).map(
          (type) => secrets.filter((s) => s.type === type).length
        ),
        backgroundColor: ["#00d1ff", "#6be8ff", "#ff7a7a", "#ffcc00", "#00b894"],
      },
    ],
  };

  const secretsBarData = {
    labels: Array.from(new Set(secrets.map((s) => s.file))),
    datasets: [
      {
        label: "Secrets Count",
        data: Array.from(new Set(secrets.map((s) => s.file))).map(
          (file) => secrets.filter((s) => s.file === file).length
        ),
        backgroundColor: "#00d1ff",
      },
    ],
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 px-4">
      <div className="bg-[#1e293b] p-6 rounded-xl border border-blue-900 shadow-xl w-full max-w-4xl relative animate-fadeIn overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-3 right-3 hover:text-red-400">
          <XCircle size={26} />
        </button>

        <h2 className="text-2xl font-bold text-blue-400 mb-4">Repository Details</h2>

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <StatDetail label="URL" value={repo.gitUrl} />
          <StatDetail label="Branch" value={repo.Branch || "N/A"} />
          <StatDetail label="Status" value={repo.Status} valueColor={repo.Status === "Vulnerable" ? "text-red-400" : "text-green-400"} />
          <StatDetail label="Total Secrets" value={repo.TotalSecrets ?? secrets.length} />
          <StatDetail label="Verified Repositories" value={repo.VerifiedRepositories ?? 0} />
          <StatDetail label="Unverified Repositories" value={repo.UnverifiedRepositories ?? 0} />
          <StatDetail label="Created At" value={new Date(repo.createdAt).toLocaleString()} />
          <StatDetail label="Updated At" value={new Date(repo.updatedAt).toLocaleString()} />
        </div>

        {/* Notifications */}
        <Section title="Notifications">
          {messages.map((msg, idx) => {
            const style = getMessageStyle(msg.type);
            return (
              <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${style.bg} shadow-inner`}>
                <span className="text-lg mt-1">{style.icon}</span>
                <p className={`${style.text} text-sm break-words`}>{msg.text}</p>
              </div>
            );
          })}
        </Section>

        {/* Secrets Charts */}
        {secrets.length > 0 && (
          <Section title="Secrets Overview">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className={CARD_STYLE}>
                <h4 className="text-sm font-semibold mb-2">Secrets by Type</h4>
                <Pie data={secretsPieData} />
              </div>
              <div className={CARD_STYLE}>
                <h4 className="text-sm font-semibold mb-2">Secrets by File</h4>
                <Bar data={secretsBarData} />
              </div>
            </div>
          </Section>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-sm font-medium"
            onClick={() => window.open(repo.gitUrl, "_blank")}
          >
            Open in new tab
          </button>
          <button
            className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-sm font-medium"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* Small Components */
const StatDetail = ({ label, value, valueColor = "text-gray-300" }: any) => (
  <div className="bg-[#0f172a] p-3 rounded-lg border border-gray-700">
    <p className="text-gray-400 text-xs">{label}</p>
    <p className={`text-sm font-semibold break-all ${valueColor}`}>{value}</p>
  </div>
);

const Section = ({ title, children }: any) => (
  <div className="mb-4">
    <h3 className="text-yellow-400 font-semibold mb-2">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

export default EmployedLogs;
