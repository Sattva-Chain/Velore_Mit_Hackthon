const { maskSecretValue } = require("./findingStorage");

const PROVIDER_PATTERNS = [
	/^gh[pousr]_/i,
	/^github_pat_/i,
	/^sk_(live|test|proj)_/i,
	/^xox[baprs]-/i,
	/^AKIA[0-9A-Z]{16}$/i,
	/^ASIA[0-9A-Z]{16}$/i,
	/^AIza[0-9A-Za-z\-_]{20,}$/i,
	/^ya29\./i,
	/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./,
];

function isDocsOrExample(input) {
	const haystack = `${input.filePath || ""}\n${input.contextText || ""}\n${input.rawSecret || ""}`.toLowerCase();
	return /(docs?|readme|example|sample|fixture|mock|test|spec|demo)/.test(haystack);
}

function isPrivateKey(input) {
	return /BEGIN [A-Z0-9 ]*PRIVATE KEY/.test(String(input.rawSecret || ""));
}

function isDatabaseUrlWithPassword(input) {
	return /^[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^/\s@]+@/i.test(
		String(input.rawSecret || "").trim(),
	);
}

function hasStrongProviderPrefix(input) {
	const value = String(input.rawSecret || "").trim();
	return PROVIDER_PATTERNS.some((pattern) => pattern.test(value));
}

function hasBearerToken(input) {
	return /^bearer\s+[a-z0-9._-]{16,}$/i.test(String(input.contextText || "").trim());
}

function hasSecretAssignmentContext(input) {
	const haystack = `${input.contextText || ""}\n${input.filePath || ""}\n${input.secretType || ""}`.toLowerCase();
	return /(secret|token|password|passwd|pwd|apikey|api_key|auth|credential|private_key|connectionstring|mongodb_uri)/.test(
		haystack,
	);
}

function isConfigOrSourcePath(input) {
	const file = String(input.filePath || "").toLowerCase();
	return /\.(env|json|ya?ml|toml|ini|conf|config|ts|tsx|js|jsx|py|go|java|rb|php|cs)$/.test(
		file,
	);
}

function scoreConfidence(input) {
	let score = 35;

	if (hasStrongProviderPrefix(input)) score += 35;
	if (hasSecretAssignmentContext(input)) score += 20;
	if (isConfigOrSourcePath(input)) score += 10;
	if (!/entropy/i.test(String(input.secretType || ""))) score += 10;
	if (typeof input.detectorConfidence === "number") {
		score += Math.round(Math.max(0, Math.min(1, input.detectorConfidence)) * 10);
	}
	if (isDocsOrExample(input)) score -= 30;
	if (/redacted|example|dummy|sample|changeme|placeholder/i.test(String(input.rawSecret || ""))) {
		score -= 25;
	}

	return Math.max(5, Math.min(99, score));
}

function evaluateSeverity(input, confidence) {
	if (isPrivateKey(input) || isDatabaseUrlWithPassword(input)) return "critical";
	if (hasStrongProviderPrefix(input) && isConfigOrSourcePath(input) && !isDocsOrExample(input)) {
		return "critical";
	}
	if (hasStrongProviderPrefix(input) || hasBearerToken(input)) return "high";
	if (isDocsOrExample(input) || confidence < 35) return "low";
	if (/entropy/i.test(String(input.secretType || "")) || hasSecretAssignmentContext(input)) {
		return "medium";
	}
	return "low";
}

function scoreFinding(input) {
	const confidence = scoreConfidence(input);
	const severity = evaluateSeverity(input, confidence);
	return {
		severity,
		confidence,
		preview: maskSecretValue(input.rawSecret),
	};
}

module.exports = {
	scoreFinding,
};
