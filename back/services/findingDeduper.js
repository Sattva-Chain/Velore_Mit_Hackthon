const SEVERITY_ORDER = {
	low: 1,
	medium: 2,
	high: 3,
	critical: 4,
};

function locationKey(location) {
	return [
		location.filePath || "",
		location.lineStart || "",
		location.lineEnd || "",
		location.git?.commit || "",
	].join("|");
}

function chooseSeverity(a, b) {
	return (SEVERITY_ORDER[a] || 0) >= (SEVERITY_ORDER[b] || 0) ? a : b;
}

function dedupeCanonicalFindings(findings = []) {
	const byFingerprint = new Map();

	for (const finding of findings) {
		const existing = byFingerprint.get(finding.fingerprint);
		if (!existing) {
			byFingerprint.set(finding.fingerprint, {
				...finding,
				detectors: [...new Set(finding.detectors || [])],
				locations: [...(finding.locations || [])],
				occurrenceCount: finding.locations?.length || finding.occurrenceCount || 1,
			});
			continue;
		}

		existing.severity = chooseSeverity(existing.severity, finding.severity);
		existing.confidence = Math.max(existing.confidence || 0, finding.confidence || 0);
		existing.detectors = [...new Set([...(existing.detectors || []), ...(finding.detectors || [])])];

		const seenLocations = new Set(existing.locations.map(locationKey));
		for (const location of finding.locations || []) {
			const key = locationKey(location);
			if (seenLocations.has(key)) continue;
			existing.locations.push(location);
			seenLocations.add(key);
		}

		existing.occurrenceCount = existing.locations.length;
		const allIgnored = existing.locations.every((location) => location.ignored);
		existing.ignored = allIgnored;
		existing.ignoreScope =
			allIgnored &&
			existing.locations.every(
				(location) => location.ignoreScope === existing.locations[0]?.ignoreScope,
			)
				? existing.locations[0]?.ignoreScope || null
				: null;
		existing.decision = existing.ignored ? "ignored" : "active";

		const firstSeenDates = [existing.git?.firstSeenDate, finding.git?.firstSeenDate]
			.filter(Boolean)
			.sort();
		existing.git = {
			commit: existing.git?.commit || finding.git?.commit || null,
			branch: existing.git?.branch || finding.git?.branch || null,
			ageDays:
				typeof existing.git?.ageDays === "number"
					? existing.git.ageDays
					: typeof finding.git?.ageDays === "number"
						? finding.git.ageDays
						: null,
			firstSeenDate: firstSeenDates[0] || null,
			note:
				existing.git?.note === "uncommitted" || finding.git?.note === "uncommitted"
					? "uncommitted"
					: existing.git?.note || finding.git?.note || null,
		};
	}

	for (const finding of byFingerprint.values()) {
		const [primaryLocation] = finding.locations;
		if (primaryLocation) {
			finding.filePath = primaryLocation.filePath;
			finding.lineStart = primaryLocation.lineStart;
			finding.lineEnd = primaryLocation.lineEnd;
			finding.preview = primaryLocation.preview || finding.preview;
		}
	}

	return Array.from(byFingerprint.values());
}

module.exports = {
	dedupeCanonicalFindings,
};
