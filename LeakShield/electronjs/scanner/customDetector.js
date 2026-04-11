import fs from "fs";
import path from "path";

const ignoreDirs = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
]);

const ignoreExtensions = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
  ".mp4", ".mp3", ".pdf", ".zip", ".exe", ".dll"
]);

const strongRules = [
  {
    name: "MongoDB URI",
    regex: /mongodb\+srv:\/\/[^\s"'`]+/g,
    confidence: 95,
  },
  {
    name: "AWS Access Key",
    regex: /AKIA[0-9A-Z]{16}/g,
    confidence: 98,
  },
  {
    name: "GitHub Token",
    regex: /ghp_[A-Za-z0-9]{36}/g,
    confidence: 98,
  },
  {
    name: "Google API Key",
    regex: /AIza[0-9A-Za-z\-_]{35}/g,
    confidence: 97,
  },
  {
    name: "OpenAI Key",
    regex: /sk-[A-Za-z0-9]{20,}/g,
    confidence: 96,
  },
  {
    name: "JWT Token",
    regex: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+/g,
    confidence: 88,
  },
];

const assignmentRegex =
  /\b(api[_-]?key|secret|access[_-]?token|refresh[_-]?token|private[_-]?key|client[_-]?secret|db[_-]?url|database[_-]?url|password)\b\s*[:=]\s*["'`]?([^"'`\s]{12,})["'`]?/gi;

const bannedValues = new Set([
  "jwt.sign",
  "createtoken",
  "req.cookies",
  "process.env",
  "bearer",
  "token",
  "secret",
  "password",
  "undefined",
  "null",
  "true",
  "false",
]);

function shouldIgnore(filePath) {
  const parts = filePath.split(path.sep);
  if (parts.some((part) => ignoreDirs.has(part))) return true;

  const ext = path.extname(filePath).toLowerCase();
  return ignoreExtensions.has(ext);
}

function walk(dir, files = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (shouldIgnore(fullPath)) continue;

    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function maskSecret(secret) {
  if (!secret) return "Hidden";
  if (secret.length <= 8) return secret;
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

function looksLikeRealSecret(value) {
  if (!value) return false;
  if (value.length < 12) return false;
  if (value.includes(" ")) return false;
  if (value.includes("(") || value.includes(")")) return false;

  const lower = value.toLowerCase();
  if (bannedValues.has(lower)) return false;

  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSymbol = /[_\-./+=]/.test(value);

  const varietyScore =
    Number(hasUpper) + Number(hasLower) + Number(hasDigit) + Number(hasSymbol);

  return varietyScore >= 2;
}

function getContextBoost(filePath, lineText) {
  let score = 0;
  const lowerPath = filePath.toLowerCase();
  const lowerLine = lineText.toLowerCase();

  if (
    lowerPath.includes(".env") ||
    lowerPath.includes("config") ||
    lowerPath.includes("secret") ||
    lowerPath.includes("auth")
  ) {
    score += 10;
  }

  if (
    lowerLine.includes("apikey") ||
    lowerLine.includes("api_key") ||
    lowerLine.includes("secret") ||
    lowerLine.includes("token") ||
    lowerLine.includes("password")
  ) {
    score += 10;
  }

  return score;
}

function pushFinding(findings, seen, item) {
  const key = `${item.detector}|${item.path}|${item.line}|${item.rawSecret}`;
  if (seen.has(key)) return;
  seen.add(key);
  findings.push(item);
}

export function scanFilesForSecrets(rootDir) {
  const files = walk(rootDir);
  const findings = [];
  const seen = new Set();

  for (const file of files) {
    let content = "";

    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);

    lines.forEach((lineText, index) => {
      // 1) strong exact-pattern rules
      for (const rule of strongRules) {
        const matches = [...lineText.matchAll(rule.regex)];

        for (const match of matches) {
          const raw = match[0];
          pushFinding(findings, seen, {
            detector: rule.name,
            verified: false,
            confidence: rule.confidence,
            severity: rule.confidence >= 95 ? "High" : "Medium",
            secret: maskSecret(raw),
            rawSecret: raw,
            path: path.relative(rootDir, file),
            line: index + 1,
            commit: "N/A",
            source: "Custom Detector",
          });
        }
      }

      // 2) assignment-based rule with filtering
      const matches = [...lineText.matchAll(assignmentRegex)];

      for (const match of matches) {
        const variableName = match[1] || "";
        const raw = match[2] || "";

        if (!looksLikeRealSecret(raw)) continue;

        const confidence = Math.min(
          90,
          65 + getContextBoost(file, lineText) + (raw.length >= 20 ? 10 : 0)
        );

        if (confidence < 75) continue;

        pushFinding(findings, seen, {
          detector: `Assigned ${variableName}`,
          verified: false,
          confidence,
          severity: confidence >= 85 ? "High" : "Medium",
          secret: maskSecret(raw),
          rawSecret: raw,
          path: path.relative(rootDir, file),
          line: index + 1,
          commit: "N/A",
          source: "Custom Detector",
        });
      }
    });
  }

  return findings;
}