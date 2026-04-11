const crypto = require("crypto");

function normalizeSecretValue(value) {
	return String(value || "").trim();
}

function computeFingerprint({ secretType, normalizedSecretValue, ruleId }) {
	const payload = `${String(secretType || "").trim()}:${normalizeSecretValue(normalizedSecretValue)}:${String(ruleId || "").trim()}`;
	return crypto.createHash("sha256").update(payload).digest("hex");
}

module.exports = {
	normalizeSecretValue,
	computeFingerprint,
};
