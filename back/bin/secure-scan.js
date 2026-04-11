#!/usr/bin/env node

const path = require("path");
const { runLocalScan, installPreCommitHook } = require("../services/localRepoCli");

function parseArgs(argv) {
	const out = { _: [] };
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		if (!token.startsWith("--")) {
			out._.push(token);
			continue;
		}
		const key = token.slice(2);
		if (key === "staged") {
			out.staged = true;
			continue;
		}
		const value = argv[i + 1];
		if (value == null || value.startsWith("--")) {
			throw new Error(`Missing value for --${key}`);
		}
		out[key] = value;
		i++;
	}
	return out;
}

function usage() {
	return [
		"Usage:",
		"  secure-scan scan --repo . --staged",
		"  secure-scan install-hook [--repo .]",
	].join("\n");
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const command = args._[0];

	if (!command || command === "--help" || command === "help") {
		process.stdout.write(`${usage()}\n`);
		process.exitCode = 0;
		return;
	}

	if (command === "scan") {
		const result = await runLocalScan({
			repoPath: args.repo || process.cwd(),
			staged: !!args.staged,
			stdout: process.stdout,
		});
		process.exitCode = result.exitCode;
		return;
	}

	if (command === "install-hook") {
		const result = await installPreCommitHook({
			repoPath: args.repo || process.cwd(),
			cliScriptPath: path.resolve(__filename),
			nodePath: process.execPath,
			stdout: process.stdout,
		});
		if (result.exitCode !== 0 && result.message) {
			process.stderr.write(`${result.message}\n`);
		}
		process.exitCode = result.exitCode;
		return;
	}

	throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
	process.stderr.write(`${error.message || String(error)}\n`);
	process.stderr.write(`${usage()}\n`);
	process.exitCode = 1;
});
