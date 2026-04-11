import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import { spawn, execFile } from "child_process";
import { promisify } from "util";
import { scanFilesForSecrets } from "./scanner/customDetector.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path for local history storage
const HISTORY_FILE = path.join(os.homedir(), '.leakshield_history.json');

let mainWindow = null;
let activeChild = null;
let activeTempDir = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "LeakShield Core",
    backgroundColor: "#010409",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  
  // Replace with your dev URL or build path
  mainWindow.loadURL("http://localhost:5173"); 
}

// --- UTILS ---
function getTrufflehogPath() {
  return path.resolve(__dirname, "bin", "trufflehog-win.exe");
}

function maskSecret(secret = "") {
  if (!secret || typeof secret !== "string") return "Hidden";
  return secret.length <= 8 ? secret : `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

function normalizeFinding(parsed, tempBaseDir) {
  const fsMeta = parsed?.SourceMetadata?.Data?.Filesystem || {};
  const relativePath = fsMeta.file || parsed?.Path || "Unknown";
  
  return {
    detector: parsed?.DetectorName || "Secret Detected",
    secret: maskSecret(parsed?.Raw || ""),
    rawSecret: parsed?.Raw || "",
    path: relativePath,
    fullPath: path.join(tempBaseDir, relativePath),
    line: parseInt(fsMeta.line || 1),
    source: "TruffleHog",
  };
}

// --- IPC HANDLERS ---

// 1. Fetch History from local JSON
ipcMain.handle('get-history', async () => {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  try {
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) { return []; }
});

// Save a new scan to history
ipcMain.handle('save-to-history', async (event, scanEntry) => {
  let history = [];
  if (fs.existsSync(HISTORY_FILE)) {
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    history = JSON.parse(data);
  }
  // Add to start, keep last 50
  history.unshift({ ...scanEntry, timestamp: new Date().toLocaleString() });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(0, 50), null, 2));
  return history;
});
// 3. Read file content for the code viewer
ipcMain.handle("get-file-content", async (_event, filePath) => {
  try {
    const cleanPath = path.normalize(filePath);
    if (!fs.existsSync(cleanPath)) return { success: false, message: "File not found" };
    const content = fs.readFileSync(cleanPath, "utf-8");
    return { success: true, content };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 4. Main Scan Logic
ipcMain.handle("scan-repo", async (_event, repoUrl) => {
  try {
    if (activeChild) return { success: false, message: "Scan already in progress" };
    
    // Cleanup old temp directory
    if (activeTempDir && fs.existsSync(activeTempDir)) {
      fs.rmSync(activeTempDir, { recursive: true, force: true });
    }
    activeTempDir = path.join(os.tmpdir(), `leakshield-${Date.now()}`);

    // Clone
    await execFileAsync("git", ["clone", "--depth", "1", repoUrl, activeTempDir]);

    // Run TruffleHog
    activeChild = spawn(getTrufflehogPath(), ["filesystem", activeTempDir, "--json", "--no-update"], { 
      windowsHide: true 
    });

    activeChild.stdout.on("data", (data) => {
      data.toString().split(/\r?\n/).forEach(line => {
        if (!line.trim()) return;
        try {
          const parsed = JSON.parse(line);
          const finding = normalizeFinding(parsed, activeTempDir);
          mainWindow?.webContents.send("scan-result", finding);
        } catch (e) {}
      });
    });

    activeChild.on("close", () => {
      // Run Custom Regex Detector
      const customFindings = scanFilesForSecrets(activeTempDir);
      customFindings.forEach(f => {
        f.fullPath = path.join(activeTempDir, f.path);
        mainWindow?.webContents.send("scan-result", f);
      });
      
      mainWindow?.webContents.send("scan-done");
      activeChild = null;
    });

    return { success: true };
  } catch (error) {
    activeChild = null;
    return { success: false, message: error.message };
  }
});

// --- APP LIFECYCLE ---
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  if (activeTempDir && fs.existsSync(activeTempDir)) {
    fs.rmSync(activeTempDir, { recursive: true, force: true });
  }
});