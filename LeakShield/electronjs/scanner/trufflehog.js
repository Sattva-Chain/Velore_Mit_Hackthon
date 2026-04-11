import { spawn } from "child_process";
import path from "path";
import os from "os";

function getBinaryPath() {
  const platform = os.platform();
  if (platform === "win32") {
    return path.join(process.cwd(), "electron", "bin", "trufflehog-win.exe");
  }
  if (platform === "darwin") {
    return path.join(process.cwd(), "electron", "bin", "trufflehog-mac");
  }
  return path.join(process.cwd(), "electron", "bin", "trufflehog-linux");
}

export function runTrufflehog(repoUrlOrPath, onResult, onError, onClose) {
  const binary = getBinaryPath();

  const args = ["git", repoUrlOrPath, "--json"];

  const child = spawn(binary, args, { windowsHide: true });

  child.stdout.on("data", (chunk) => {
    const lines = chunk.toString().split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        onResult(parsed);
      } catch {
        // ignore non-json log lines
      }
    }
  });

  child.stderr.on("data", (chunk) => {
    onError(chunk.toString());
  });

  child.on("close", (code) => {
    onClose(code);
  });

  return child;
}