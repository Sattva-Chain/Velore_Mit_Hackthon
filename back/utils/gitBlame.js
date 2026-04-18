const path = require("path");
const { spawn } = require("child_process");

function emptyBlameInfo() {
  return {
    author: null,
    authorEmail: null,
    email: null,
    commitTime: null,
    commitHash: null,
    assignedTo: null,
  };
}

function toIsoTime(unixSeconds) {
  const stamp = Number(unixSeconds);
  if (!Number.isFinite(stamp) || stamp <= 0) return null;
  try {
    return new Date(stamp * 1000).toISOString();
  } catch {
    return null;
  }
}

function normalizeEmail(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;
  return value.replace(/^<|>$/g, "") || null;
}

function parseGitBlameOutput(stdout) {
  const info = emptyBlameInfo();
  const lines = String(stdout || "").split(/\r?\n/);

  const header = lines[0] || "";
  const hash = header.split(" ")[0]?.trim();
  if (hash && /^[a-f0-9]{7,40}$/i.test(hash)) {
    info.commitHash = hash;
  }

  for (const line of lines) {
    if (line.startsWith("author ")) {
      info.author = line.slice("author ".length).trim() || null;
      continue;
    }
    if (line.startsWith("author-mail ")) {
      info.authorEmail = normalizeEmail(line.slice("author-mail ".length));
      info.email = info.authorEmail;
      continue;
    }
    if (line.startsWith("author-time ")) {
      info.commitTime = toIsoTime(line.slice("author-time ".length));
    }
  }

  info.assignedTo = info.author;
  return info;
}

function buildCandidatePaths(filePath, repoRoot) {
  const raw = String(filePath || "")
    .replace(/^file:\/\//i, "")
    .trim();
  if (!raw || raw === "unknown") return [];

  const candidates = [];
  const seen = new Set();
  const add = (value) => {
    const normalized = String(value || "").replace(/\\/g, "/").trim();
    if (!normalized || normalized === "." || normalized.startsWith("../")) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    candidates.push(normalized);
  };

  if (path.isAbsolute(raw)) {
    const relative = path.relative(repoRoot, raw);
    if (relative && !relative.startsWith("..")) add(relative);
  } else {
    add(raw);
  }

  const base = candidates[0];
  if (!base) return candidates;

  const parts = base.split("/").filter(Boolean);
  for (let i = 1; i < parts.length; i++) {
    add(parts.slice(i).join("/"));
  }

  return candidates;
}

function runGitBlame(repoRoot, filePath, lineNumber) {
  return new Promise((resolve) => {
    const child = spawn(
      "git",
      ["blame", "-L", `${lineNumber},${lineNumber}`, "--porcelain", "--", filePath],
      {
        cwd: repoRoot,
        windowsHide: true,
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      if (code === 0 && stdout.trim()) {
        resolve(parseGitBlameOutput(stdout));
        return;
      }
      if (stderr) {
        resolve(null);
        return;
      }
      resolve(null);
    });
  });
}

async function getGitBlameInfo(filePath, lineNumber, repoRoot = process.cwd()) {
  const safeDefault = emptyBlameInfo();
  const line = Number.parseInt(String(lineNumber), 10);

  if (!repoRoot || !Number.isFinite(line) || line < 1) {
    return safeDefault;
  }

  const candidates = buildCandidatePaths(filePath, repoRoot);
  if (!candidates.length) return safeDefault;

  try {
    for (const candidate of candidates) {
      const blameInfo = await runGitBlame(repoRoot, candidate, line);
      if (blameInfo) return blameInfo;
    }
  } catch {
  }

  return safeDefault;
}

module.exports = {
  getGitBlameInfo,
  emptyBlameInfo,
};
