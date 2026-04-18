/// <reference types="vite/client" />

interface ElectronSessionPayload {
  token: string | null;
  user: unknown;
  organization: unknown;
  company: unknown;
  repo: unknown;
}

interface Window {
  electronAPI?: {
    storeToken?: (token: string) => Promise<void>;
    getToken?: () => Promise<string | null>;
    clearToken?: () => Promise<void>;
    login?: (session: ElectronSessionPayload) => Promise<void>;
    logout?: () => Promise<void>;
    getSession?: () => Promise<ElectronSessionPayload | null>;
    setSession?: (session: ElectronSessionPayload) => Promise<void>;
    clearSession?: () => Promise<void>;
    storeGithubToken?: (token: string) => Promise<void>;
    getGithubToken?: () => Promise<string | null>;
    clearGithubToken?: () => Promise<void>;
    savePDF?: (data: string, filename: string) => void;
    onSavePDFSuccess?: (callback: (args: { message: string; filePath: string }) => void) => void;
  };
}
