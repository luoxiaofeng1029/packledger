"use strict";

const SYSTEM_FILE_NAMES = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);

function shouldSkipFileName(fileName) {
  return SYSTEM_FILE_NAMES.has(fileName);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function slugifyTitle(title) {
  const normalized = String(title || "packledger-package")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "packledger-package";
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildManifestCsv(records) {
  const headers = ["index", "relative_path", "original_name", "size_bytes", "sha256", "last_modified_iso"];
  const lines = [headers.join(",")];

  records.forEach((record, index) => {
    lines.push([
      index + 1,
      record.relativePath,
      record.originalName,
      record.sizeBytes,
      record.sha256,
      record.lastModifiedIso
    ].map(escapeCsv).join(","));
  });

  return `${lines.join("\n")}\n`;
}

function buildSha256Text(records) {
  return records.map((record) => `${record.sha256}  files/${record.relativePath}`).join("\n") + "\n";
}

function buildReadmeText({ title, author, note, createdAt, fileCount, totalBytes }) {
  const lines = [
    `Package: ${title || "Untitled package"}`,
    `Created: ${createdAt}`,
    `Created by: ${author || "Unknown"}`,
    `Files: ${fileCount}`,
    `Total size: ${formatBytes(totalBytes)}`,
    "",
    "This package was generated with PackLedger.",
    "Use manifest.csv to review the file list and checksums.sha256 to verify file integrity."
  ];

  if (note) {
    lines.push("", "Notes:", note);
  }

  return `${lines.join("\n")}\n`;
}

function normalizeArchivePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .join("/");
}

function createUniquePath(pathValue, usedPaths) {
  const normalized = normalizeArchivePath(pathValue);
  const parts = normalized.split("/");
  const fileName = parts.pop() || "file";
  const dotIndex = fileName.lastIndexOf(".");
  const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex > 0 ? fileName.slice(dotIndex) : "";
  const directory = parts.length > 0 ? `${parts.join("/")}/` : "";

  let candidate = `${directory}${fileName}`;
  let counter = 2;

  while (usedPaths.has(candidate)) {
    candidate = `${directory}${baseName}-${counter}${extension}`;
    counter += 1;
  }

  usedPaths.add(candidate);
  return candidate;
}

function toPublicRecord(record) {
  return {
    relativePath: record.relativePath,
    originalName: record.originalName,
    sizeBytes: record.sizeBytes,
    sizeLabel: formatBytes(record.sizeBytes),
    sha256: record.sha256,
    lastModifiedIso: record.lastModifiedIso
  };
}

module.exports = {
  SYSTEM_FILE_NAMES,
  shouldSkipFileName,
  formatBytes,
  slugifyTitle,
  escapeCsv,
  buildManifestCsv,
  buildSha256Text,
  buildReadmeText,
  normalizeArchivePath,
  createUniquePath,
  toPublicRecord
};
