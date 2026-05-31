"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("packledger", {
  getVersion: () => ipcRenderer.invoke("app:version"),
  selectFiles: () => ipcRenderer.invoke("dialog:select-files"),
  selectFolder: () => ipcRenderer.invoke("dialog:select-folder"),
  selectOutput: () => ipcRenderer.invoke("dialog:select-output"),
  analyzePaths: (paths) => ipcRenderer.invoke("package:analyze", paths),
  createPackage: (packageSpec) => ipcRenderer.invoke("package:create", packageSpec),
  showItem: (targetPath) => ipcRenderer.invoke("shell:show-item", targetPath)
});
