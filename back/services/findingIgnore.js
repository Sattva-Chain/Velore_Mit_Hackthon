const fs = require("fs");
const path = require("path");

const SHARED_IGNORE_FILE = ".securescanignore";
const LOCAL_IGNORE_FILE = ".securescan.localignore";

function parseRule(line, scope) {
	const trimmed = String(line || "").trim();
	if (!trimmed || trimmed.startsWith("#")) return null;
	if (/^[a-f0-9]{64}$/i.test(trimmed)) {
		return { type: "fingerprint", value: trimmed.toLowerCase(), scope };
	}
	const [kind, ...rest] = trimmed.split(":");
	if (!rest.length) return { type: "fingerprint", value: trimmed.toLowerCase(), scope };
	return {
		type: kind.trim().toLowerCase(),
		value: rest.join(":").trim(),
		scope,
	};
}

function loadRulesFromFile(filePath, scope) {
	if (!fs.existsSync(filePath)) return [];
	try {
		const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
		return lines.map((line) => parseRule(line, scope)).filter(Boolean);
	} catch {
		return [];
	}
}

function wildcardToRegExp(value) {
	const escaped = String(value || "")
		.replace(/[.+^${}()|[\]\\]/g, "\\$&")
		.replace(/\*/g, ".*");
	return new RegExp(`^${escaped}$`, "i");
}

function loadIgnoreConfig(repoPath) {
	if (!repoPath) return { shared: [], local: [] };
	return {
		shared: loadRulesFromFile(path.join(repoPath, SHARED_IGNORE_FILE), "shared"),
		local: loadRulesFromFile(path.join(repoPath, LOCAL_IGNORE_FILE), "local"),
	};
}

function matchesRule(rule, finding) {
	const filePath = String(finding.filePath || "");
	switch (rule.type) {
		case "fingerprint":
			return finding.fingerprint === String(rule.value || "").toLowerCase();
		case "path":
			return wildcardToRegExp(rule.value).test(filePath);
		case "rule":
			return String(finding.ruleId || "").toLowerCase() ===
				String(rule.value || "").toLowerCase();
		case "type":
			return String(finding.secretType || "").toLowerCase() ===
				String(rule.value || "").toLowerCase();
		default:
			return false;
	}
}

function matchIgnoreScope(finding, ignoreConfig) {
	for (const scope of ["local", "shared"]) {
		const rules = ignoreConfig?.[scope] || [];
		if (rules.some((rule) => matchesRule(rule, finding))) {
			return { ignored: true, ignoreScope: scope };
		}
	}
	return { ignored: false, ignoreScope: null };
}

module.exports = {
	loadIgnoreConfig,
	matchIgnoreScope,
};
