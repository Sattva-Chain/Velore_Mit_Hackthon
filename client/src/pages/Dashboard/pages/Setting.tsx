"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  CreditCard,
  Globe,
  LogOut,
  Mail,
  Shield,
  UserCircle2,
} from "lucide-react";
import { userAuth } from "../../../context/Auth";

interface CompanyData {
  companyName: string;
  emailId: string;
  CompanyURL: string;
  totalEmployees?: string | number;
  loggedInCount?: string | number;
  totalRepositories?: string | number;
  totalVerified?: string | number;
  totalUnverified?: string | number;
  vulnerableCount?: string | number;
}

interface UserData {
  email: string;
  role: string;
  Branch: string;
  userType: string;
  LastScanned?: string;
  VerifiedRepositories?: string | number;
  UnverifiedRepositories?: string | number;
  TotalRepositories?: string | number;
  companyId?: string | {
    companyName: string;
    CompanyURL: string;
  };
}

const CARD = "rounded-lg border border-zinc-800 bg-zinc-900/70 p-5";
const PANEL = "rounded-lg border border-zinc-800 bg-zinc-900/70 overflow-hidden";

const Settings: React.FC = () => {
  const auth = userAuth();
  const { user, company, logout } = auth! as unknown as {
    user: UserData | null;
    company: CompanyData | null;
    logout: () => Promise<void>;
  };

  const [activeTab, setActiveTab] = useState("Profile");
  const [userType, setUserType] = useState<"organization" | "developer">("developer");

  useEffect(() => {
    if (company?.companyName || user?.userType === "organization") {
      setUserType("organization");
    } else {
      setUserType("developer");
    }
  }, [company, user]);

  const logoutHandler = async () => {
    await logout();
  };

  const developerStats = useMemo(
    () => [
      {
        label: "Role",
        value: user?.role || "Developer",
        tone: "text-blue-300",
        icon: UserCircle2,
      },
      {
        label: "Repositories",
        value: user?.TotalRepositories ?? 0,
        tone: "text-emerald-300",
        icon: Globe,
      },
      {
        label: "Verified",
        value: user?.VerifiedRepositories ?? 0,
        tone: "text-sky-300",
        icon: Shield,
      },
      {
        label: "Needs attention",
        value: user?.UnverifiedRepositories ?? 0,
        tone: "text-orange-300",
        icon: CreditCard,
      },
    ],
    [user]
  );

  const organizationStats = useMemo(
    () => [
      {
        label: "Organization",
        value: company?.companyName || "LeakShield Org",
        tone: "text-blue-300",
        icon: Building2,
      },
      {
        label: "Members",
        value: company?.totalEmployees ?? 0,
        tone: "text-emerald-300",
        icon: UserCircle2,
      },
      {
        label: "Repositories",
        value: company?.totalRepositories ?? 0,
        tone: "text-sky-300",
        icon: Globe,
      },
      {
        label: "Vulnerable employees",
        value: company?.vulnerableCount ?? 0,
        tone: "text-orange-300",
        icon: Shield,
      },
    ],
    [company]
  );

  const formatDate = (value?: string) => {
    if (!value) return "No recent scans";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
  };

  const tabs = ["Profile", "Security", "Notifications"];
  const statCards = userType === "organization" ? organizationStats : developerStats;

  return (
    <div className="w-full flex flex-col gap-8 text-zinc-200 pb-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your workspace profile, account access, and session preferences with the same LeakShield dashboard controls.
          </p>
        </div>
        <button
          onClick={logoutHandler}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white transition-colors text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={CARD}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{card.label}</p>
                <Icon className={`w-4 h-4 ${card.tone}`} />
              </div>
              <div className={`text-2xl font-semibold ${card.tone} break-words`}>
                {card.value ?? "N/A"}
              </div>
            </div>
          );
        })}
      </section>

      <section className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
              activeTab === tab
                ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </section>

      {activeTab === "Profile" && (
        <section className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-4">
          <div className={PANEL}>
            <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/40">
              <h2 className="text-sm font-semibold text-zinc-100">
                {userType === "organization" ? "Organization profile" : "Developer profile"}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Core identity and workspace details available to the current session.
              </p>
            </div>

            <div className="p-5 space-y-5">
              {userType === "organization" && company && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailCard
                    icon={<Building2 className="w-4 h-4 text-blue-300" />}
                    label="Company name"
                    value={company.companyName}
                  />
                  <DetailCard
                    icon={<Mail className="w-4 h-4 text-blue-300" />}
                    label="Organization email"
                    value={company.emailId}
                  />
                  <DetailCard
                    icon={<Globe className="w-4 h-4 text-blue-300" />}
                    label="Company URL"
                    value={company.CompanyURL || "Not provided"}
                    href={company.CompanyURL}
                  />
                  <DetailCard
                    icon={<UserCircle2 className="w-4 h-4 text-blue-300" />}
                    label="Active employees"
                    value={company.loggedInCount ?? 0}
                  />
                  <DetailCard
                    icon={<Shield className="w-4 h-4 text-blue-300" />}
                    label="Verified repositories"
                    value={company.totalVerified ?? 0}
                  />
                  <DetailCard
                    icon={<Shield className="w-4 h-4 text-orange-300" />}
                    label="Unverified repositories"
                    value={company.totalUnverified ?? 0}
                    accent="text-orange-300"
                  />
                </div>
              )}

              {userType === "developer" && user && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailCard
                    icon={<Mail className="w-4 h-4 text-blue-300" />}
                    label="Email"
                    value={user.email}
                  />
                  <DetailCard
                    icon={<UserCircle2 className="w-4 h-4 text-blue-300" />}
                    label="Role"
                    value={user.role || "Developer"}
                  />
                  <DetailCard
                    icon={<Globe className="w-4 h-4 text-blue-300" />}
                    label="Current branch"
                    value={user.Branch || "Not available"}
                  />
                  <DetailCard
                    icon={<Shield className="w-4 h-4 text-blue-300" />}
                    label="Last scanned"
                    value={formatDate(user.LastScanned)}
                  />
                  <DetailCard
                    icon={<Shield className="w-4 h-4 text-emerald-300" />}
                    label="Verified repositories"
                    value={user.VerifiedRepositories ?? 0}
                    accent="text-emerald-300"
                  />
                  <DetailCard
                    icon={<Shield className="w-4 h-4 text-orange-300" />}
                    label="Unverified repositories"
                    value={user.UnverifiedRepositories ?? 0}
                    accent="text-orange-300"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className={CARD}>
              <h2 className="text-sm font-semibold text-zinc-100 mb-4">Workspace status</h2>
              <div className="space-y-3">
                <StatusRow
                  label="Session type"
                  value={userType === "organization" ? "Organization workspace" : "Solo developer workspace"}
                />
                <StatusRow
                  label="Protection scope"
                  value={userType === "organization" ? "Team-wide visibility enabled" : "Personal scan visibility enabled"}
                />
                <StatusRow
                  label="Access mode"
                  value="Electron session persistence active"
                />
              </div>
            </div>

            {user?.companyId && typeof user.companyId !== "string" && (
              <div className={CARD}>
                <h2 className="text-sm font-semibold text-zinc-100 mb-4">Associated organization</h2>
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                  <p className="text-lg font-semibold text-zinc-100">{user.companyId.companyName}</p>
                  <a
                    href={user.companyId.CompanyURL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 mt-3"
                  >
                    Visit organization website
                    <Globe className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            <div className={CARD}>
              <h2 className="text-sm font-semibold text-zinc-100 mb-4">Quick notes</h2>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400 leading-6">
                This page is presentation-only for now. Account enforcement, role permissions, and secure session validation continue to stay on the backend and Electron layer.
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "Security" && (
        <section className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
          <div className={CARD}>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-blue-300" />
              <h2 className="text-sm font-semibold text-zinc-100">Security posture</h2>
            </div>
            <div className="space-y-3">
              <StatusRow label="Authentication" value="Backend JWT validation enabled" />
              <StatusRow label="Password handling" value="Protected by hashed credential flow" />
              <StatusRow label="Session storage" value="Persisted through Electron session bridge" />
            </div>
          </div>

          <div className={PANEL}>
            <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/40">
              <h2 className="text-sm font-semibold text-zinc-100">Security controls roadmap</h2>
              <p className="text-xs text-zinc-500 mt-1">Planned improvements stay aligned with the current app architecture.</p>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Password reset flow",
                "Session activity history",
                "Device visibility",
                "Audit-oriented preference controls",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === "Notifications" && (
        <section className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
          <div className={CARD}>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-blue-300" />
              <h2 className="text-sm font-semibold text-zinc-100">Notification routing</h2>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400 leading-6">
              Invite email delivery, scan feedback, and organization activity notifications are wired through the backend so delivery rules stay centralized and safe.
            </div>
          </div>

          <div className={PANEL}>
            <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/40">
              <h2 className="text-sm font-semibold text-zinc-100">Upcoming notification preferences</h2>
              <p className="text-xs text-zinc-500 mt-1">These are placeholders for future controls, styled consistently with the existing UI.</p>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Invite accepted alerts",
                "High severity scan digests",
                "Repository verification reminders",
                "Organization summary updates",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const DetailCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  href?: string;
  accent?: string;
}> = ({ icon, label, value, href, accent = "text-zinc-100" }) => (
  <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500 font-bold mb-3">
      {icon}
      {label}
    </div>
    {href ? (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium text-blue-300 hover:text-blue-200 break-all"
      >
        {value || "Not provided"}
      </a>
    ) : (
      <div className={`text-sm font-medium break-words ${accent}`}>{value ?? "Not provided"}</div>
    )}
  </div>
);

const StatusRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3">
    <span className="text-sm text-zinc-500">{label}</span>
    <span className="text-sm text-zinc-200 text-right">{value}</span>
  </div>
);

export default Settings;
