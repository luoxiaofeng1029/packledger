"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const JSZip = require("jszip");
const {
  buildManifestCsv,
  buildReadmeText,
  buildSha256Text,
  createUniquePath,
  shouldSkipFileName,
  slugifyTitle,
  toPublicRecord
} = require("../shared/manifest");

async function pathExists(value) {
  try {
    await fs.access(value);
    return true;
  } catch {
    return false;
  }
}

async function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  const handle = await fs.open(filePath, "r");

  try {
    for await (const chunk of handle.readableWebStream()) {
      hash.update(Buffer.from(chunk));
    }
  } finally {
    await handle.close();
  }

  return hash.digest("hex");
}

async function walkDirectory(rootPath, currentPath, usedPaths, records) {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldSkipFileName(entry.name)) {
      continue;
    }

    const absolutePath = path.join(currentPath, entry.name);

    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      await walkDirectory(rootPath, absolutePath, usedPaths, records);
      continue;
    }

    if (entry.isFile()) {
      const relativeFromRoot = path.relative(path.dirname(rootPath), absolutePath);
      await addFileRecord(absolutePath, relativeFromRoot, usedPaths, records);
    }
  }
}

async function addFileRecord(filePath, requestedRelativePath, usedPaths, records) {
  const stat = await fs.stat(filePath);
  const relativePath = createUniquePath(requestedRelativePath, usedPaths);
  const sha256 = await hashFile(filePath);

  records.push({
    sourcePath: filePath,
    relativePath,
    originalName: path.basename(filePath),
    sizeBytes: stat.size,
    sha256,
    lastModifiedIso: stat.mtime.toISOString()
  });
}

async function scanPaths(inputPaths) {
  const paths = Array.isArray(inputPaths) ? inputPaths.filter(Boolean) : [];
  if (paths.length === 0) {
    return [];
  }

  const records = [];
  const usedPaths = new Set();

  for (const inputPath of paths) {
    const absolutePath = path.resolve(inputPath);
    const stat = await fs.stat(absolutePath);

    if (stat.isDirectory()) {
      await walkDirectory(absolutePath, absolutePath, usedPaths, records);
      continue;
    }

    if (stat.isFile() && !shouldSkipFileName(path.basename(absolutePath))) {
      await addFileRecord(absolutePath, path.basename(absolutePath), usedPaths, records);
    }
  }

  return records.sort((a, b) => a.relativePath.localeCompare(b.relativePath, "en"));
}

function buildSummary(records) {
  return {
    fileCount: records.length,
    totalBytes: records.reduce((sum, record) => sum + record.sizeBytes, 0)
  };
}

async function nextAvailableZipPath(outputDir, slug) {
  let candidate = path.join(outputDir, `${slug}.zip`);
  let counter = 2;

  while (await pathExists(candidate)) {
    candidate = path.join(outputDir, `${slug}-${counter}.zip`);
    counter += 1;
  }

  return candidate;
}

async function createPackage(packageSpec) {
  const title = String(packageSpec.title || "").trim() || "PackLedger package";
  const author = String(packageSpec.author || "").trim();
  const note = String(packageSpec.note || "").trim();
  const outputDir = packageSpec.outputDir ? path.resolve(packageSpec.outputDir) : null;

  if (!outputDir) {
    throw new Error("Please choose an output folder.");
  }

  await fs.mkdir(outputDir, { recursive: true });

  const records = await scanPaths(packageSpec.inputPaths);
  if (records.length === 0) {
    throw new Error("No files were found to package.");
  }

  const summary = buildSummary(records);
  const createdAt = new Date().toISOString();
  const publicRecords = records.map(toPublicRecord);
  const report = {
    appVersion: packageSpec.appVersion || "0.1.0",
    packageTitle: title,
    author,
    note,
    createdAt,
    fileCount: summary.fileCount,
    totalBytes: summary.totalBytes,
    files: publicRecords
  };

  const zip = new JSZip();
  for (const record of records) {
    const data = await fs.readFile(record.sourcePath);
    zip.file(`files/${record.relativePath}`, data);
  }

  zip.file("manifest.csv", buildManifestCsv(records));
  zip.file("checksums.sha256", buildSha256Text(records));
  zip.file("README.txt", buildReadmeText({ title, author, note, createdAt, ...summary }));
  zip.file("packledger-report.json", `${JSON.stringify(report, null, 2)}\n`);

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });

  const zipPath = await nextAvailableZipPath(outputDir, slugifyTitle(title));
  await fs.writeFile(zipPath, zipBuffer);

  return {
    zipPath,
    ...summary,
    files: publicRecords
  };
}

module.exports = {
  scanPaths,
  createPackage,
  buildSummary,
  hashFile
};
