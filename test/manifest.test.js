"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildManifestCsv,
  buildReadmeText,
  buildSha256Text,
  createUniquePath,
  escapeCsv,
  formatBytes,
  shouldSkipFileName,
  slugifyTitle
} = require("../src/shared/manifest");
const { PACKAGE_TEMPLATES, getTemplateById } = require("../src/shared/templates");

test("formats bytes with compact labels", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(1024), "1.0 KB");
  assert.equal(formatBytes(10 * 1024), "10 KB");
});

test("slugifies English and Chinese titles", () => {
  assert.equal(slugifyTitle("Final Pack 2026!"), "final-pack-2026");
  assert.equal(slugifyTitle("报名材料 包"), "报名材料-包");
  assert.equal(slugifyTitle(""), "packledger-package");
});

test("escapes CSV cells", () => {
  assert.equal(escapeCsv("plain"), "plain");
  assert.equal(escapeCsv("a,b"), '"a,b"');
  assert.equal(escapeCsv('say "hi"'), '"say ""hi"""');
});

test("builds manifest and checksum files", () => {
  const records = [
    {
      relativePath: "docs/a.txt",
      originalName: "a.txt",
      sizeBytes: 3,
      sha256: "abc",
      lastModifiedIso: "2026-05-31T00:00:00.000Z"
    }
  ];

  assert.match(buildManifestCsv(records), /index,relative_path,original_name,size_bytes,sha256,last_modified_iso/);
  assert.equal(buildSha256Text(records), "abc  files/docs/a.txt\n");
});

test("creates unique archive paths", () => {
  const used = new Set();
  assert.equal(createUniquePath("a/report.pdf", used), "a/report.pdf");
  assert.equal(createUniquePath("a/report.pdf", used), "a/report-2.pdf");
  assert.equal(createUniquePath("a/report.pdf", used), "a/report-3.pdf");
});

test("skips common system files", () => {
  assert.equal(shouldSkipFileName(".DS_Store"), true);
  assert.equal(shouldSkipFileName("desktop.ini"), true);
  assert.equal(shouldSkipFileName("report.pdf"), false);
});

test("readme includes package metadata", () => {
  const text = buildReadmeText({
    title: "Coursework",
    author: "Tester",
    note: "For review",
    createdAt: "2026-05-31T00:00:00.000Z",
    fileCount: 2,
    totalBytes: 2048
  });

  assert.match(text, /Package: Coursework/);
  assert.match(text, /Created by: Tester/);
  assert.match(text, /Notes:\nFor review/);
});

test("package templates include common submission scenarios", () => {
  assert.deepEqual(PACKAGE_TEMPLATES.map((template) => template.id), ["blank", "homework", "job", "event"]);
  assert.equal(getTemplateById("homework").title, "Homework submission package");
  assert.equal(getTemplateById("missing").id, "blank");
});
