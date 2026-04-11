function maskSecretValue(secret) {
	const value = String(secret || "").trim();
	if (!value) return "Hidden";
	if (value.length <= 8) {
		return `${value.slice(0, 2)}...${value.slice(-2)}`;
	}
	const prefixLength = value.startsWith("sk-") ? 3 : Math.min(4, value.length - 4);
	return `${value.slice(0, prefixLength)}...${value.slice(-4)}`;
}

function sanitizeLineText(text, secret) {
	const line = String(text || "");
	const masked = maskSecretValue(secret);
	if (!secret) return line.slice(0, 300);
	return line.split(String(secret)).join(masked).slice(0, 300);
}

function sanitizeSnippet(snippet, secret) {
	if (!snippet?.lines?.length) return null;
	return {
		highlightLine: snippet.highlightLine ?? null,
		lines: snippet.lines.map((line) => ({
			num: line.num,
			text: sanitizeLineText(line.text, secret),
		})),
	};
}

function sanitizeLocationForStorage(location, secret) {
	return {
		filePath: location.filePath,
		lineStart: location.lineStart ?? null,
		lineEnd: location.lineEnd ?? null,
		preview: maskSecretValue(secret),
		ignored: !!location.ignored,
		ignoreScope: location.ignoreScope || null,
		snippet: sanitizeSnippet(location.snippet, secret),
		git: location.git
			? {
					commit: location.git.commit || null,
					branch: location.git.branch || null,
					ageDays:
						typeof location.git.ageDays === "number" ? location.git.ageDays : null,
					firstSeenDate: location.git.firstSeenDate || null,
					note: location.git.note || null,
				}
			: null,
	};
}

function sanitizeForStorage(finding) {
	const maskedPreview = maskSecretValue(finding.rawSecret);
	return {
		id: finding.id,
		fingerprint: finding.fingerprint,
		source: finding.source,
		secretType: finding.secretType,
		severity: finding.severity,
		confidence: finding.confidence,
		decision: finding.decision,
		filePath: finding.filePath,
		lineStart: finding.lineStart,
		lineEnd: finding.lineEnd,
		preview: maskedPreview,
		ruleId: finding.ruleId,
		reason: finding.reason,
		ignored: finding.ignored,
		ignoreScope: finding.ignoreScope,
		occurrenceCount: finding.occurrenceCount,
		locations: (finding.locations || []).map((location) =>
			sanitizeLocationForStorage(location, finding.rawSecret),
		),
		detectors: [...(finding.detectors || [])],
		git: finding.git,
		remediation: finding.remediation,
		storage: {
			...(finding.storage || {}),
			sanitized: true,
			maskedPreview,
			persistable: true,
		},
	};
}

module.exports = {
	maskSecretValue,
	sanitizeSnippet,
	sanitizeForStorage,
};
