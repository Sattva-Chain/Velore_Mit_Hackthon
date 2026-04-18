import { useEffect, useMemo, useState, type FormEvent } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "./AuthShell";
import { userAuth } from "../../context/Auth";

const API_BASE_URL = "http://localhost:3000";

export default function InviteAcceptPage() {
  const navigate = useNavigate();
  const { setSession } = userAuth()!;
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [invite, setInvite] = useState<{ email: string; role: string; organizationName: string } | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const title = useMemo(
    () => (invite ? `Join ${invite.organizationName}` : "Accept organization invite"),
    [invite]
  );

  useEffect(() => {
    let active = true;

    (async () => {
      if (!token) {
        setFetching(false);
        return;
      }
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/auth/invite/${token}`);
        if (active && data?.success) {
          setInvite(data.invite);
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Unable to load invite.");
      } finally {
        if (active) setFetching(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !password.trim()) {
      toast.error("Invite token and password are required.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/invite/accept`, {
        token,
        name,
        password,
      });

      if (!data?.success || !data?.token) {
        toast.error(data?.message || "Unable to accept invite.");
        return;
      }

      await setSession({
        token: data.token,
        user: data.user || null,
        organization: data.organization || null,
        company: data.organization
          ? {
              _id: data.organization._id,
              companyName: data.organization.name,
              emailId: data.organization.owner?.email || "",
              totalEmployees: data.organization.totalMembers ?? data.organization.members?.length ?? 0,
              employees: data.organization.members ?? [],
              dashboardStats: {
                totalRepositories: data.organization.summary?.repos ?? 0,
                verifiedRepositories: data.organization.summary?.fixed ?? 0,
                unverifiedRepositories: data.organization.summary?.open ?? 0,
                vulnerableAccounts: data.organization.summary?.open ?? 0,
                scannedMembersCount: data.organization.members?.length ?? 0,
              },
            }
          : null,
        repo: data.repositories || null,
      });

      toast.success("Invite accepted successfully.");
      navigate("/Dashboard2", { replace: true });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to accept invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={title} subtitle="Set your password to activate your employee account">
      {fetching ? (
        <div className="text-sm text-slate-400">Loading invite details...</div>
      ) : !invite ? (
        <div className="text-sm text-rose-300">This invite link is missing or no longer valid.</div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            <p>
              <span className="text-slate-500">Organization:</span> {invite.organizationName}
            </p>
            <p className="mt-2">
              <span className="text-slate-500">Invited email:</span> {invite.email}
            </p>
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="w-full mt-2 p-3 bg-white/10 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create your password"
              className="w-full mt-2 p-3 bg-white/10 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-800 text-white rounded-lg w-full font-semibold transition"
          >
            {loading ? "Activating account..." : "Activate account"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
