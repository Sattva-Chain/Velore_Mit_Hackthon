class ScanError extends Error {
	constructor(message, options = {}) {
		super(message);
		this.name = this.constructor.name;
		this.code = options.code || "SCAN_ERROR";
		this.httpStatus = options.httpStatus || 500;
		this.kind = options.kind || "fatal";
		this.details = options.details || null;
		this.warnings = Array.isArray(options.warnings) ? options.warnings : [];
	}
}

class FatalScanError extends ScanError {
	constructor(message, options = {}) {
		super(message, {
			...options,
			code: options.code || "SCAN_FATAL",
			httpStatus: options.httpStatus || 500,
			kind: "fatal",
		});
	}
}

class DegradedScanError extends ScanError {
	constructor(message, options = {}) {
		super(message, {
			...options,
			code: options.code || "SCAN_DEGRADED",
			httpStatus: options.httpStatus || 200,
			kind: "degraded",
		});
	}
}

class StorageConfigError extends ScanError {
	constructor(message, options = {}) {
		super(message, {
			...options,
			code: options.code || "STORAGE_CONFIG_ERROR",
			httpStatus: options.httpStatus || 500,
			kind: "storage",
		});
	}
}

function toApiErrorPayload(error) {
	const fallbackMessage = "Unexpected scan error.";
	return {
		error: true,
		code: error?.code || "SCAN_ERROR",
		kind: error?.kind || "fatal",
		message: error?.message || fallbackMessage,
		warnings: Array.isArray(error?.warnings) ? error.warnings : [],
	};
}

function asScanError(error, fallbackMessage = "Unexpected scan error.") {
	if (error instanceof ScanError) return error;
	return new FatalScanError(error?.message || fallbackMessage, {
		details: error,
	});
}

module.exports = {
	ScanError,
	FatalScanError,
	DegradedScanError,
	StorageConfigError,
	toApiErrorPayload,
	asScanError,
};
