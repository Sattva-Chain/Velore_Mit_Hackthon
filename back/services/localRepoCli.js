const fs = require("fs");
const path = require("path");
const {
	runGit,
	detectGitRepoRoot,
	createStagedSnapshotWorkspace,
	cleanupPath,
} = require("./scanRuntime");
const { executeScanWorkspace } = require("./scanPipeline");

function activeFindings(results) {
	return (results?.findings || []).filter((finding) => !finding.ignored);
}

function summarizeFindings(findings) {
	const critical = findings.filter((finding) => finding.severity === "critical").length;
	const high = findings.filter((finding) => finding.severity === "high").length;
	const files = new Set(
		findings.flatMap((finding) =>
			(finding.locations || []).map((location) => location.filePath || finding.filePath),
		),
	);
	return {
		critical,
		high,
		filesAffected: files.size,
	};
}

function formatFindingLine(finding) {
	const location = (finding.locations || [])[0] || {};
	const filePath = location.filePath || finding.filePath || "unknown";
	const line = location.lineStart || finding.lineStart || "N/A";
	return `${String(finding.severity || "low").toUpperCase()} ${filePath}:${line} ${finding.secretType}`;
}

function printScanSummary({ stdout, findings, warnings = [], stagedFiles = [] }) {
	const summary = summarizeFindings(findings);
	if (summary.critical > 0) {
		stdout.write(
			`Secure Scan blocked commit: ${summary.critical} critical finding${summary.critical === 1 ? "" : "s"} in ${summary.filesAffected} file${summary.filesAffected === 1 ? "" : "s"}.\n`,
		);
	} else {
		stdout.write(
			`Secure Scan completed: ${summary.critical} critical, ${summary.high} high across ${summary.filesAffected} file${summary.filesAffected === 1 ? "" : "s"}.\n`,
		);
	}

	if (stagedFiles.length) {
		stdout.write(`Scanned staged files: ${stagedFiles.length}\n`);
	}

	for (const line of findings.slice(0, 5).map(formatFindingLine)) {
		stdout.write(`${line}\n`);
	}

	for (const warning of warnings.slice(0, 3)) {
		stdout.write(`Warning: ${warning}\n`);
	}

	return summary;
}

async function runLocalScan({
	repoPath = process.cwd(),
	staged = false,
	stdout = process.stdout,
} = {}) {
	if (!staged) {
		throw new Error("Only staged local scan mode is implemented in this step.");
	}

	const resolvedRepoRoot = await detectGitRepoRoot(repoPath);
	const snapshot = await createStagedSnapshotWorkspace(resolvedRepoRoot);
	try {
		if (!snapshot.stagedFiles.length) {
			stdout.write("Secure Scan: no staged files to scan.\n");
			return {
				exitCode: 0,
				repoRoot: resolvedRepoRoot,
				stagedFiles: [],
				results: { findings: [], warnings: [] },
				summary: { critical: 0, high: 0, filesAffected: 0 },
			};
		}

		const { formatted, warnings } = await executeScanWorkspace({
			repoPath: snapshot.snapshotPath,
			isGitRepo: false,
			sourceType: "git",
		});
		const findings = activeFindings(formatted);
		const summary = printScanSummary({
			stdout,
			findings,
			warnings,
			stagedFiles: snapshot.stagedFiles,
		});
		return {
			exitCode: summary.critical > 0 ? 2 : 0,
			repoRoot: resolvedRepoRoot,
			stagedFiles: snapshot.stagedFiles,
			results: formatted,
			summary,
		};
	} finally {
		cleanupPath(snapshot.snapshotPath);
	}
}

function shellPath(value) {
	const normalized = path.resolve(value);
	return process.platform === "win32" ? normalized.replace(/\\/g, "/") : normalized;
}

function hookScript({ repoRoot, cliScriptPath, nodePath }) {
	const repoArg = shellPath(repoRoot);
	const cliArg = shellPath(cliScriptPath);
	const nodeArg = shellPath(nodePath);
	return `#!/bin/sh
# Secure Scan pre-commit hook
"${nodeArg}" "${cliArg}" scan --repo "${repoArg}" --staged
`;
}

async function resolveHookPath(repoRoot) {
	const { stdout } = await runGit(["rev-parse", "--git-path", "hooks/pre-commit"], {
		cwd: repoRoot,
	});
	return path.resolve(repoRoot, String(stdout || "").trim());
}

async function installPreCommitHook({
	repoPath = process.cwd(),
	cliScriptPath,
	nodePath = process.execPath,
	stdout = process.stdout,
} = {}) {
	if (!cliScriptPath) {
		throw new Error("CLI script path is required to install the pre-commit hook.");
	}

	const repoRoot = await detectGitRepoRoot(repoPath);
	const hookPath = await resolveHookPath(repoRoot);
	if (fs.existsSync(hookPath)) {
		const existing = fs.readFileSync(hookPath, "utf8");
		if (existing.trim().length > 0) {
			return {
				exitCode: 1,
				repoRoot,
				hookPath,
				installed: false,
				message: "Refused to overwrite existing pre-commit hook.",
			};
		}
	}

	fs.mkdirSync(path.dirname(hookPath), { recursive: true });
	fs.writeFileSync(
		hookPath,
		hookScript({ repoRoot, cliScriptPath, nodePath }),
		"utf8",
	);
	try {
		fs.chmodSync(hookPath, 0o755);
	} catch {}

	stdout.write(`Installed Secure Scan hook at ${hookPath}\n`);
	return {
		exitCode: 0,
		repoRoot,
		hookPath,
		installed: true,
		message: "Installed Secure Scan pre-commit hook.",
	};
}

module.exports = {
	runLocalScan,
	installPreCommitHook,
};
