const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onMeetingData: (callback) => ipcRenderer.on("meeting-data", callback),
  openExternal: (url) => ipcRenderer.send("open-external", url),
  dismissNotification: () => ipcRenderer.send("dismiss-notification"),
});
