import { createContext, useState, useEffect, useContext, type ReactNode } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const TOKEN_STORAGE_KEY = "secure-scan-token";

interface UserData {
  _id: string;
  email: string;
  role?: string;
  gitUrl?: string[];
  Branch?: string;
  LastScanned?: string;
  userType?: string;
  name?: string;
  number?: string;
  empId?: string;
  TotalRepositories?: number;
  VerifiedRepositories?: number;
  UnverifiedRepositories?: number;
}

interface Repository {
  _id: string;
  userId: string;
  gitUrl: string;
  Branch: string;
  LastScanned: string;
  Status: "Vulnerable" | "Safe" | "Pending";
  createdAt: string;
  updatedAt: string;
}

interface CompanyData {
  _id: string;
  companyName: string;
  CompanyURL: string;
  emailId: string;
  totalRepositories?: string;
  totalEmployees: string;
  loggedInCount?: number;
  employees?: any[];
  developersCount?: number;
  vulnerableCount?: number;
}

interface AuthContextType {
  token: string | null;
  user: UserData | null;
  repo: Repository[] | null;
  company: CompanyData | null;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
  setRepo: React.Dispatch<React.SetStateAction<Repository[] | null>>;
  setCompany: React.Dispatch<React.SetStateAction<CompanyData | null>>;
  setToken: (token: string | null) => Promise<void>;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [repo, setRepo] = useState<Repository[] | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);

  const navigate = useNavigate();

  const readStoredToken = async () => {
    try {
      const electronToken = await window.electronAPI?.getToken?.();
      if (typeof electronToken === "string" && electronToken.trim()) {
        return electronToken.trim();
      }
    } catch (error) {
      console.warn("Electron token read failed:", error);
    }

    try {
      return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadToken = async () => {
      const savedToken = await readStoredToken();
      if (savedToken) setTokenState(savedToken);
    };
    loadToken();
  }, []);

  const setToken = async (newToken: string | null) => {
    const normalizedToken =
      typeof newToken === "string" && newToken.trim() ? newToken.trim() : null;

    setTokenState(normalizedToken);

    try {
      if (normalizedToken) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, normalizedToken);
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors in restricted contexts.
    }

    try {
      if (normalizedToken) {
        await window.electronAPI?.storeToken?.(normalizedToken);
      } else {
        await window.electronAPI?.clearToken?.();
      }
    } catch (error) {
      console.warn("Electron token write failed:", error);
    }
  };

  const clearResolvedState = () => {
    setRepo(null);
    setUser(null);
    setCompany(null);
  };

  const refreshUserByToken = async (activeToken: string | null) => {
    if (!activeToken) {
      clearResolvedState();
      return;
    }

    try {
      const userRes = await axios.post("http://localhost:3000/api/authsss", {
        token: activeToken,
      });
      if (userRes.data.success) {
        setRepo(userRes.data.repositories || []);
        setUser(userRes.data.userDatas);
        setCompany(null);
        return;
      }

      const companyRes = await axios.post("http://localhost:3000/api/auths", {
        token: activeToken,
      });
      if (companyRes.data.success) {
        setCompany(companyRes.data.compnaydatas);
        setRepo(null);
        setUser(null);
        return;
      }

      await setToken(null);
      clearResolvedState();
    } catch (error) {
      console.error("Auth refresh failed:", error);
    }
  };

  const login = async (nextToken: string) => {
    await setToken(nextToken);
    await refreshUserByToken(nextToken);
  };

  const logout = async () => {
    await setToken(null);
    clearResolvedState();
    navigate("/");
  };

  const refreshUser = async () => {
    await refreshUserByToken(token);
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      clearResolvedState();
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        repo,
        company,
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
