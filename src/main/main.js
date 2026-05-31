"use strict";

const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { createPackage, scanPaths, buildSummary } = require("./package-service");
const { formatBytes, toPublicRecord } = require("../shared/manifest");
const pkg = require("../../package.json");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 920,
    minHeight: 640,
    title: "PackLedger",
    backgroundColor: "#f6f3ee",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("app:version", () => pkg.version);

ipcMain.handle("dialog:select-files", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Choose files",
    properties: ["openFile", "multiSelections"]
  });
  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle("dialog:select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Choose a folder",
    properties: ["openDirectory", "multiSelections"]
  });
  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle("dialog:select-output", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Choose output folder",
    properties: ["openDirectory", "createDirectory"]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("package:analyze", async (_event, inputPaths) => {
  const records = await scanPaths(inputPaths);
  const summary = buildSummary(records);
  return {
    ...summary,
    totalSizeLabel: formatBytes(summary.totalBytes),
    files: records.map(toPublicRecord)
  };
});

ipcMain.handle("package:create", async (_event, packageSpec) => {
  return createPackage({
    ...packageSpec,
    appVersion: pkg.version
  });
});

ipcMain.handle("shell:show-item", async (_event, targetPath) => {
  if (!targetPath) {
    return false;
  }
  shell.showItemInFolder(targetPath);
  return true;
});
