"use strict";

const state = {
  inputPaths: [],
  outputDir: "",
  files: [],
  lastZipPath: ""
};

const elements = {
  versionLabel: document.querySelector("#versionLabel"),
  templateSelect: document.querySelector("#templateSelect"),
  titleInput: document.querySelector("#titleInput"),
  authorInput: document.querySelector("#authorInput"),
  noteInput: document.querySelector("#noteInput"),
  outputInput: document.querySelector("#outputInput"),
  dropZone: document.querySelector("#dropZone"),
  chooseFilesButton: document.querySelector("#chooseFilesButton"),
  chooseFolderButton: document.querySelector("#chooseFolderButton"),
  chooseOutputButton: document.querySelector("#chooseOutputButton"),
  clearButton: document.querySelector("#clearButton"),
  createButton: document.querySelector("#createButton"),
  fileRows: document.querySelector("#fileRows"),
  fileCount: document.querySelector("#fileCount"),
  totalSize: document.querySelector("#totalSize"),
  statusText: document.querySelector("#statusText"),
  resultBox: document.querySelector("#resultBox"),
  resultPath: document.querySelector("#resultPath"),
  showResultButton: document.querySelector("#showResultButton")
};

function initializeTemplates() {
  const templateApi = window.PackLedgerTemplates;
  if (!templateApi) {
    return;
  }

  templateApi.PACKAGE_TEMPLATES.forEach((template) => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.label;
    elements.templateSelect.append(option);
  });

  elements.templateSelect.addEventListener("change", () => {
    const template = templateApi.getTemplateById(elements.templateSelect.value);
    elements.titleInput.value = template.title;
    elements.noteInput.value = template.note;
  });
}

function setStatus(text) {
  elements.statusText.textContent = text;
}

function setBusy(isBusy) {
  elements.createButton.disabled = isBusy || state.files.length === 0 || !state.outputDir;
  elements.chooseFilesButton.disabled = isBusy;
  elements.chooseFolderButton.disabled = isBusy;
  elements.chooseOutputButton.disabled = isBusy;
  elements.clearButton.disabled = isBusy;
}

function uniquePaths(paths) {
  return [...new Set(paths.filter(Boolean))];
}

function renderFiles(summary) {
  state.files = summary.files || [];
  elements.fileCount.textContent = String(summary.fileCount || 0);
  elements.totalSize.textContent = summary.totalSizeLabel || "0 B";
  elements.fileRows.innerHTML = "";

  if (state.files.length === 0) {
    elements.fileRows.innerHTML = '<tr class="empty-row"><td colspan="3">No files selected.</td></tr>';
    setBusy(false);
    return;
  }

  const fragment = document.createDocumentFragment();
  state.files.forEach((file) => {
    const row = document.createElement("tr");
    const pathCell = document.createElement("td");
    const sizeCell = document.createElement("td");
    const hashCell = document.createElement("td");

    pathCell.textContent = file.relativePath;
    sizeCell.textContent = file.sizeLabel;
    hashCell.textContent = file.sha256;
    hashCell.className = "hash";

    row.append(pathCell, sizeCell, hashCell);
    fragment.append(row);
  });

  elements.fileRows.append(fragment);
  setBusy(false);
}

async function analyzeSelectedPaths() {
  if (state.inputPaths.length === 0) {
    renderFiles({ files: [], fileCount: 0, totalSizeLabel: "0 B" });
    setStatus("Ready");
    return;
  }

  setStatus("Scanning");
  setBusy(true);
  elements.resultBox.hidden = true;

  try {
    const summary = await window.packledger.analyzePaths(state.inputPaths);
    renderFiles(summary);
    setStatus(summary.fileCount > 0 ? "Ready" : "No files");
  } catch (error) {
    renderFiles({ files: [], fileCount: 0, totalSizeLabel: "0 B" });
    setStatus(error.message || "Scan failed");
  } finally {
    setBusy(false);
  }
}

async function addPaths(paths) {
  state.inputPaths = uniquePaths([...state.inputPaths, ...paths]);
  await analyzeSelectedPaths();
}

elements.chooseFilesButton.addEventListener("click", async () => {
  const paths = await window.packledger.selectFiles();
  await addPaths(paths);
});

elements.chooseFolderButton.addEventListener("click", async () => {
  const paths = await window.packledger.selectFolder();
  await addPaths(paths);
});

elements.chooseOutputButton.addEventListener("click", async () => {
  const outputDir = await window.packledger.selectOutput();
  if (outputDir) {
    state.outputDir = outputDir;
    elements.outputInput.value = outputDir;
    setBusy(false);
  }
});

elements.clearButton.addEventListener("click", () => {
  state.inputPaths = [];
  state.files = [];
  state.lastZipPath = "";
  elements.resultBox.hidden = true;
  renderFiles({ files: [], fileCount: 0, totalSizeLabel: "0 B" });
  setStatus("Ready");
});

elements.createButton.addEventListener("click", async () => {
  setStatus("Building");
  setBusy(true);
  elements.resultBox.hidden = true;

  try {
    const result = await window.packledger.createPackage({
      title: elements.titleInput.value,
      author: elements.authorInput.value,
      note: elements.noteInput.value,
      outputDir: state.outputDir,
      inputPaths: state.inputPaths
    });

    state.lastZipPath = result.zipPath;
    elements.resultPath.textContent = result.zipPath;
    elements.resultBox.hidden = false;
    setStatus("Created");
  } catch (error) {
    setStatus(error.message || "Build failed");
  } finally {
    setBusy(false);
  }
});

elements.showResultButton.addEventListener("click", async () => {
  if (state.lastZipPath) {
    await window.packledger.showItem(state.lastZipPath);
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove("dragging");
  });
});

elements.dropZone.addEventListener("drop", async (event) => {
  const paths = [...event.dataTransfer.files].map((file) => file.path).filter(Boolean);
  await addPaths(paths);
});

window.packledger.getVersion().then((version) => {
  elements.versionLabel.textContent = `v${version}`;
});

initializeTemplates();
renderFiles({ files: [], fileCount: 0, totalSizeLabel: "0 B" });
