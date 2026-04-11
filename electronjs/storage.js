const fs = require("fs");
const path = require("path");
const { app } = require("electron/main");

const STORE_DIR_NAME = "secure-scan";
const STORE_FILE_NAME = "state.json";
const LEGACY_STORE_FILE = path.join(
	__dirname,
	".electron-store",
	"secure-scan.json",
);

function getStoreDir() {
	return path.join(app.getPath("userData"), STORE_DIR_NAME);
}

function getStoreFile() {
	return path.join(getStoreDir(), STORE_FILE_NAME);
}

function ensureStoreDir() {
	const dir = getStoreDir();
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	return dir;
}

function sanitizeState(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return {};
	const nextState = {};
	for (const key of ["companyToken", "githubToken"]) {
		const current = value[key];
		if (typeof current === "string" && current.trim()) {
			nextState[key] = current.trim();
		}
	}
	return nextState;
}

function backupMalformedStore(filePath) {
	try {
		if (!fs.existsSync(filePath)) return;
		const stamp = new Date().toISOString().replace(/[:.]/g, "-");
		fs.renameSync(filePath, `${filePath}.corrupt-${stamp}`);
	} catch (error) {
		console.warn("Failed to preserve malformed Electron store:", error.message);
	}
}

function tryReadJson(filePath) {
	if (!fs.existsSync(filePath)) return null;
	const raw = fs.readFileSync(filePath, "utf8");
	if (!raw.trim()) return {};
	return JSON.parse(raw);
}

function writeState(nextState) {
	ensureStoreDir();
	fs.writeFileSync(
		getStoreFile(),
		JSON.stringify(sanitizeState(nextState), null, 2),
		"utf8",
	);
}

function migrateLegacyStoreIfPresent() {
	const currentFile = getStoreFile();
	if (fs.existsSync(currentFile) || !fs.existsSync(LEGACY_STORE_FILE)) return;
	try {
		const legacy = tryReadJson(LEGACY_STORE_FILE);
		writeState(legacy || {});
	} catch (error) {
		console.warn("Ignoring unreadable legacy Electron store:", error.message);
		backupMalformedStore(LEGACY_STORE_FILE);
	}
}

function readState() {
	ensureStoreDir();
	migrateLegacyStoreIfPresent();

	try {
		return sanitizeState(tryReadJson(getStoreFile()) || {});
	} catch (error) {
		console.warn("Recovering from malformed Electron store:", error.message);
		backupMalformedStore(getStoreFile());
		writeState({});
		return {};
	}
}

function getValue(key) {
	return readState()[key] ?? null;
}

function setValue(key, value) {
	const state = readState();
	if (typeof value === "string" && value.trim()) {
		state[key] = value.trim();
	} else {
		delete state[key];
	}
	writeState(state);
	return true;
}

function deleteValue(key) {
	const state = readState();
	delete state[key];
	writeState(state);
	return true;
}

module.exports = {
	readState,
	getValue,
	setValue,
	deleteValue,
};
