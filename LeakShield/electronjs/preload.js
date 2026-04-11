const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Methods to trigger actions
  scanRepo: (url) => ipcRenderer.invoke('scan-repo', url),
  getFileContent: (path) => ipcRenderer.invoke('get-file-content', path),
  getHistory: () => ipcRenderer.invoke('get-history'),
  saveToHistory: (sessionData) => ipcRenderer.invoke('save-to-history', sessionData),

  // Event Listeners (Frontend to Backend)
  onScanResult: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('scan-result', listener);
    return () => ipcRenderer.removeListener('scan-result', listener);
  },
  
  onScanDone: (callback) => {
    const listener = (_event) => callback();
    ipcRenderer.on('scan-done', listener);
    return () => ipcRenderer.removeListener('scan-done', listener);
  }
});
//https://github.com/kiran04-code/Lifeshield.git