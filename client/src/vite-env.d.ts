/// <reference types="vite/client" />

interface ElectronApi {
  storeToken: (token: string) => Promise<void>;
  getToken: () => Promise<string | null>;
  clearToken: () => Promise<void>;
  storeGithubToken: (token: string) => Promise<void>;
  getGithubToken: () => Promise<string | null>;
  clearGithubToken: () => Promise<void>;
  savePDF: (data: string, filename: string) => void;
  onSavePDFSuccess: (
    callback: (args: { message: string; filePath: string }) => void
  ) => void | (() => void);
}

interface Window {
  electronAPI?: ElectronApi;
}
