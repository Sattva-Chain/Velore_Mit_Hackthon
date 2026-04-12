import { createContext, useState, useEffect, useContext, useCallback, type ReactNode } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Fixed: Added useNavigate import

// 1. Expanded UserData to include fields used in Dashboard/Report
interface UserData {
  _id: string;
  email: string;
  role?: string;
  gitUrl?: string[];
  Branch?: string;
  LastScanned?: string;
  userType?: string;
  name?: string;     // Add this
  number?: string;   // Add this
  empId?: string;    // Add this
  // Missing fields fixed here:
  TotalRepositories?: number;
  VerifiedRepositories?: number;
  UnverifiedRepositories?: number;
}

// 2. Updated Repository to be used as an Array in most places
export interface Repository {
  _id: string;
  userId: string;
  gitUrl: string;
  Branch: string;
  LastScanned: string;
  Status: "Vulnerable" | "Safe" | "Pending";
  createdAt: string;
  updatedAt: string;
}

// 3. Expanded CompanyData
export interface OrgDashboardStats {
  totalRepositories: number;
  verifiedRepositories: number;
  unverifiedRepositories: number;
  vulnerableAccounts: number;
  scannedMembersCount: number;
}

interface CompanyData {
  _id: string;
  companyName: string;
  CompanyURL: string;
  emailId: string;
  totalRepositories?: string;
  totalEmployees: string;
  loggedInCount?: number;
  employees?: Record<string, unknown>[];
  /** Legacy API shape — normalized into `employees` on load */
  allEmployees?: Record<string, unknown>[];
  developersCount?: number;
  vulnerableCount?: number;
  dashboardStats?: OrgDashboardStats;
}

const AUTH_TOKEN_KEY = "velore_securescan_token";

interface AuthContextType {
  token: string | null;
  user: UserData | null;
  repo: Repository[] | null; // Fixed: Changed from single object to Array
  company: CompanyData | null;
  /** True after first load from Electron / localStorage */
  sessionHydrated: boolean;
  authReady: boolean;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
  setRepo: React.Dispatch<React.SetStateAction<Repository[] | null>>;
  setCompany: React.Dispatch<React.SetStateAction<CompanyData | null>>;
  setToken: (token: string | null) => Promise<void>;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

function mergeUserWithRepos(u: UserData, repos: Repository[]): UserData {
  const times = repos
    .map((r) => r.LastScanned)
    .filter(Boolean)
    .map((d) => new Date(d as string).getTime())
    .filter((t) => !Number.isNaN(t));
  const maxTs = times.length ? Math.max(...times) : 0;
  const safeRepos = repos.filter((r) => r.Status === "Safe").length;
  const vulnRepos = repos.filter((r) => r.Status === "Vulnerable").length;
  const otherRepos = repos.length - safeRepos - vulnRepos;

  if (repos.length === 0) {
    return { ...u };
  }

  return {
    ...u,
    LastScanned: maxTs ? new Date(maxTs).toISOString() : u.LastScanned,
    TotalRepositories: repos.length,
    VerifiedRepositories: safeRepos,
    UnverifiedRepositories: vulnRepos + Math.max(0, otherRepos),
  };
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [repo, setRepo] = useState<Repository[] | null>(null); // Fixed: Array state
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sessionHydrated, setSessionHydrated] = useState(false);

  const navigate = useNavigate(); // Fixed: Defined navigate

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let saved: string | null = null;
        try {
          saved = (await window.electronAPI?.getToken?.()) ?? null;
        } catch {
          saved = null;
        }
        if (!saved && typeof localStorage !== "undefined") {
          saved = localStorage.getItem(AUTH_TOKEN_KEY);
        }
        if (alive && saved) {
          setTokenState(saved);
        }
      } finally {
        if (alive) setSessionHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setToken = async (newToken: string | null) => {
    if (newToken) {
      setAuthReady(false);
    }
    setTokenState(newToken);
    if (typeof localStorage !== "undefined") {
      if (newToken) localStorage.setItem(AUTH_TOKEN_KEY, newToken);
      else localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    try {
      if (newToken) await window.electronAPI?.storeToken?.(newToken);
      else await window.electronAPI?.clearToken?.();
    } catch {
      /* optional in web */
    }
  };

  const login = async (token: string) => {
    await setToken(token);
  };

  const logout = async () => {
    await setToken(null);
    setUser(null);
    setCompany(null);
    setRepo(null);
    setAuthReady(true);
    navigate("/");
  };

  const refreshUser = useCallback(async () => {
    if (!token) {
      setAuthReady(true);
      return;
    }

    setAuthReady(false);
    try {
      const userRes = await axios.post("http://localhost:3000/api/authsss", { token });
      if (userRes.data.success) {
        const repos: Repository[] = userRes.data.repositories || [];
        const raw = userRes.data.userDatas;
        setRepo(repos);
        setUser(mergeUserWithRepos(raw, repos));
        setCompany(null);
        setAuthReady(true);
        return;
      }

      const companyRes = await axios.post("http://localhost:3000/api/auths", { token });
      if (companyRes.data.success) {
        const payload = companyRes.data.compnaydatas as CompanyData;
        const { allEmployees, employees: empList, ...companyRest } = payload;
        setCompany({
          ...companyRest,
          employees: empList ?? allEmployees ?? [],
        });
        setRepo(null);
        setUser(null);
        setAuthReady(true);
        return;
      }

      await setToken(null);
      setUser(null);
      setCompany(null);
      setRepo(null);
      setAuthReady(true);
      navigate("/");
    } catch (error) {
      console.error("❌ Auth Refresh Failed:", error);
      setAuthReady(true);
    }
  }, [token, navigate]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        repo,
        company,
        sessionHydrated,
        authReady,
        setUser,
        setRepo,
        setCompany,
        setToken,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const userAuth = () => useContext(AuthContext);