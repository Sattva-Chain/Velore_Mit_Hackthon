const fs = require("fs");
const os = require("os");
const path = require("path");
const util = require("util");
const AdmZip = require("adm-zip");
const { execFile } = require("child_process");
const {
	FatalScanError,
	StorageConfigError,
} = require("./scanErrors");

const execFileAsync = util.promisify(execFile);

function sanitizeExecMessage(value) {
	if (value == null) return "";
	return String(value)
		.replace(/\s+/g, " ")
		.trim();
}

function resolveBundledTrufflehogPath() {
	const candidates = [
		path.resolve(__dirname, "../../electronjs/bin/trufflehog-win.exe"),
		path.resolve(process.cwd(), "electronjs/bin/trufflehog-win.exe"),
		path.resolve(process.cwd(), "bin/trufflehog-win.exe"),
	];
	return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

function resolveTrufflehogCommand() {
	const configured = String(process.env.TRUFFLEHOG_PATH || "").trim();
	if (configured) return configured;
	if (process.platform === "win32") {
		const bundled = resolveBundledTrufflehogPath();
		if (fs.existsSync(bundled)) return bundled;
	}
	return "trufflehog";
}

function ensureDir(dirPath, label) {
	try {
		fs.mkdirSync(dirPath, { recursive: true });
		return dirPath;
	} catch (error) {
		throw new StorageConfigError(`Unable to prepare ${label} directory.`, {
			code: "RUNTIME_DIR_UNAVAILABLE",
			details: error,
		});
	}
}

function getRuntimePaths() {
	const root =
		process.env.SECURESCAN_RUNTIME_DIR?.trim() ||
		path.join(os.tmpdir(), "secure-scan-runtime");
	return {
		root: ensureDir(root, "runtime"),
		uploads: ensureDir(path.join(root, "uploads"), "upload"),
		temp: ensureDir(path.join(root, "temp"), "temporary workspace"),
	};
}

function makeWorkspacePath(kind) {
	const runtime = getRuntimePaths();
	return path.join(runtime.temp, `${Date.now()}-${kind}`);
}

function safeParseJsonLines(lines) {
	const results = [];
	if (!lines) return results;
	for (const line of String(lines).split("\n")) {
		if (!line.trim()) continue;
		try {
			results.push(JSON.parse(line));
		} catch {
			// Preserve partial scans by skipping malformed lines.
		}
	}
	return results;
}

async function runTrufflehog(scanPath) {
	const command = resolveTrufflehogCommand();
	const args = ["filesystem", "--json", scanPath];

	try {
		const { stdout, stderr } = await execFileAsync(command, args, {
			maxBuffer: 1024 * 1024 * 80,
			timeout: 1000 * 60 * 10,
		});
		return {
			findings: safeParseJsonLines(stdout),
			warnings: stderr?.trim() ? [sanitizeExecMessage(stderr)] : [],
		};
	} catch (error) {
		const partialFindings = safeParseJsonLines(error?.stdout || "");
		if (partialFindings.length > 0) {
			return {
				findings: partialFindings,
				warnings: [
					"TruffleHog exited abnormally; partial results were returned.",
					sanitizeExecMessage(error?.stderr || error?.message || ""),
				].filter(Boolean),
			};
		}

		if (error?.code === "ENOENT") {
			throw new FatalScanError(
				`TruffleHog executable not found. Set TRUFFLEHOG_PATH or place the binary at ${resolveBundledTrufflehogPath()}.`,
				{ code: "TRUFFLEHOG_MISSING", details: error },
			);
		}

		if (error?.code === "ETIMEDOUT") {
			throw new FatalScanError(
				"TruffleHog timed out before returning scan results.",
				{ code: "TRUFFLEHOG_TIMEOUT", details: error },
			);
		}

		const message =
			sanitizeExecMessage(error?.stderr) ||
			sanitizeExecMessage(error?.message) ||
			"TruffleHog scan failed.";
		throw new FatalScanError(message, {
			code: "TRUFFLEHOG_FAILED",
			details: error,
		});
	}
}

async function cloneRepo(repoURL, clonePath) {
	try {
		await execFileAsync("git", ["clone", "--depth", "1", repoURL, clonePath], {
			maxBuffer: 1024 * 1024 * 10,
		});
	} catch (error) {
		const message =
			sanitizeExecMessage(error?.stderr) ||
			sanitizeExecMessage(error?.message) ||
			"Repository clone failed.";
		throw new FatalScanError(message, {
			code: "REPO_CLONE_FAILED",
			details: error,
		});
	}
}

async function getGitMetadata(repoPath, filePath) {
	const gitDir = path.join(repoPath || "", ".git");
	if (!repoPath || !fs.existsSync(gitDir) || !filePath || filePath === "unknown") {
		return {
			commit: null,
			branch: null,
			ageDays: null,
			firstSeenDate: null,
			note: null,
		};
	}

	const relativeFile = String(filePath).replace(/\//g, path.sep);

	let branch = null;
	try {
		const { stdout } = await execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
			cwd: repoPath,
		});
		branch = String(stdout || "").trim() || null;
	} catch {
		branch = null;
	}

	try {
		const { stdout: statusStdout } = await execFileAsync(
			"git",
			["status", "--porcelain", "--", relativeFile],
			{ cwd: repoPath },
		);
		if (String(statusStdout || "").trim()) {
			return {
				commit: null,
				branch,
				ageDays: 0,
				firstSeenDate: null,
				note: "uncommitted",
			};
		}
	} catch {
		// Fall through to log lookup.
	}

	try {
		const { stdout } = await execFileAsync(
			"git",
			["log", "-1", "--format=%H|%cI", "--", relativeFile],
			{
				cwd: repoPath,
			},
		);
		const [commit, firstSeenDate] = String(stdout || "").trim().split("|");
		if (!commit) {
			return {
				commit: null,
				branch,
				ageDays: null,
				firstSeenDate: null,
				note: null,
			};
		}

		let ageDays = null;
		if (firstSeenDate) {
			const ageMs = Date.now() - new Date(firstSeenDate).getTime();
			if (Number.isFinite(ageMs)) {
				ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
			}
		}

		return {
			commit,
			branch,
			ageDays,
			firstSeenDate: firstSeenDate || null,
			note: null,
		};
	} catch {
		return {
			commit: null,
			branch,
			ageDays: null,
			firstSeenDate: null,
			note: null,
		};
	}
}

function extractZip(zipPath, extractPath) {
	try {
		fs.mkdirSync(extractPath, { recursive: true });
		new AdmZip(zipPath).extractAllTo(extractPath, true);
	} catch (error) {
		throw new FatalScanError("ZIP extraction failed.", {
			code: "ZIP_EXTRACT_FAILED",
			details: error,
		});
	}
}

function cleanupPath(targetPath) {
	if (!targetPath) return;
	try {
		if (fs.existsSync(targetPath)) {
			fs.rmSync(targetPath, { recursive: true, force: true });
		}
	} catch (error) {
		console.warn("Failed to clean runtime path:", targetPath, error.message);
	}
}

function cleanupFile(targetPath) {
	if (!targetPath) return;
	try {
		if (fs.existsSync(targetPath)) {
			fs.unlinkSync(targetPath);
		}
	} catch (error) {
		console.warn("Failed to remove runtime file:", targetPath, error.message);
	}
}

module.exports = {
	getRuntimePaths,
	makeWorkspacePath,
	runTrufflehog,
	cloneRepo,
	getGitMetadata,
	extractZip,
	cleanupPath,
	cleanupFile,
	safeParseJsonLines,
};
