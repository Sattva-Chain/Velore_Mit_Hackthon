const { app, BrowserWindow, ipcMain, dialog } = require("electron/main");
const path = require("path");
const fs = require("fs");
const storage = require("./storage");

const indexPath = path.resolve(__dirname, "../client/dist/index.html");
const useBuiltUi = app.isPackaged || process.argv.includes("--dist");

function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	console.log("--------------------------------------------------");
	if (useBuiltUi) {
		if (!fs.existsSync(indexPath)) {
			console.error(
				"Built UI not found at",
				indexPath,
				"- run: npm run build --prefix ../client",
			);
			return;
		}

		console.log("Loading UI from:", indexPath);
		win.loadFile(indexPath).catch((error) => {
			console.error("Failed to load built UI:", error);
		});
		return;
	}

	console.log("Dev mode: loading Vite at http://localhost:5173");
	win.loadURL("http://localhost:5173").catch((error) => {
		console.error(
			"Failed to load dev server. Run from electronjs: npm run dev   (or build client and use npm run start:dist)",
			error,
		);
	});
	win.webContents.openDevTools({ mode: "detach" });
}

ipcMain.handle("company-token", (event, token) => {
	return storage.setValue("companyToken", token);
});

ipcMain.handle("get-token", () => {
	return storage.getValue("companyToken");
});

ipcMain.handle("clear-token", () => {
	return storage.deleteValue("companyToken");
});

ipcMain.handle("github-token", (event, token) => {
	return storage.setValue("githubToken", token);
});

ipcMain.handle("get-github-token", () => {
	return storage.getValue("githubToken");
});

ipcMain.handle("clear-github-token", () => {
	return storage.deleteValue("githubToken");
});

ipcMain.on("save-pdf", async (event, pdfDataUri, defaultFilename) => {
	try {
		const win = BrowserWindow.getFocusedWindow();
		const { filePath } = await dialog.showSaveDialog(win, {
			defaultPath: defaultFilename,
			filters: [{ name: "PDF Files", extensions: ["pdf"] }],
		});

		if (!filePath) return;

		const base64Data = String(pdfDataUri || "").split("base64,")[1];
		if (!base64Data) {
			throw new Error("Invalid PDF payload.");
		}

		fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

		event.sender.send("save-pdf-success", {
			message: `Saved to: ${path.basename(filePath)}`,
			filePath,
		});
	} catch (error) {
		dialog.showErrorBox("Save Error", error.message);
	}
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
