const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
	storeToken: (token) => ipcRenderer.invoke("company-token", token),
	getToken: () => ipcRenderer.invoke("get-token"),
	clearToken: () => ipcRenderer.invoke("clear-token"),
	storeGithubToken: (token) => ipcRenderer.invoke("github-token", token),
	getGithubToken: () => ipcRenderer.invoke("get-github-token"),
	clearGithubToken: () => ipcRenderer.invoke("clear-github-token"),
	savePDF: (data, filename) => ipcRenderer.send("save-pdf", data, filename),
	onSavePDFSuccess: (callback) => {
		const listener = (event, arg) => callback(arg);
		ipcRenderer.on("save-pdf-success", listener);
		return () => ipcRenderer.removeListener("save-pdf-success", listener);
	},
});

console.log("Preload script loaded");
