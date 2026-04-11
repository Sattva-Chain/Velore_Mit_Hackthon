export function normalizeTrufflehogFinding(f) {
  if (!f || (!f.DetectorName && !f.Raw && !f.SourceMetadata)) return null;

  const file =
    f.SourceMetadata?.Data?.Filesystem?.file ||
    f.SourceMetadata?.Data?.Git?.file ||
    f.Path ||
    "unknown";

  const line =
    f.SourceMetadata?.Data?.Filesystem?.line ||
    f.SourceMetadata?.Data?.Git?.line ||
    f.Line ||
    "N/A";

  const commit =
    f.SourceMetadata?.Data?.Git?.commit ||
    f.Commit ||
    "N/A";

  const raw = f.Raw || "";
  const preview =
    raw.length > 8 ? `${raw.slice(0, 4)}...${raw.slice(-4)}` : raw || "Hidden";

  return {
    id: crypto.randomUUID?.() || String(Date.now() + Math.random()),
    detector: "TruffleHog",
    type: f.DetectorName || "Unknown Secret",
    verified: Boolean(f.Verified),
    confidence: f.Verified ? 95 : 60,
    file,
    line,
    commit,
    rawSecret: raw,
    secretPreview: preview,
    source: commit !== "N/A" ? "git-history" : "filesystem",
    recommendation: getRecommendation(f.DetectorName),
  };
}

function getRecommendation(type = "") {
  const t = type.toLowerCase();
  if (t.includes("aws")) return "Rotate AWS key and move it to environment variables.";
  if (t.includes("github")) return "Revoke token and regenerate with minimum scopes.";
  if (t.includes("stripe")) return "Rotate Stripe key and move it to secure config.";
  return "Remove the secret from code, rotate it, and store it securely.";
}