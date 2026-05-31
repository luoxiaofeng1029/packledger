"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const JSZip = require("jszip");
const { createPackage, scanPaths } = require("../src/main/package-service");

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "packledger-test-"));
}

test("scans nested folders and skips system files", async () => {
  const root = await makeTempDir();
  await fs.mkdir(path.join(root, "docs"));
  await fs.writeFile(path.join(root, "docs", "hello.txt"), "hello");
  await fs.writeFile(path.join(root, ".DS_Store"), "skip");

  const records = await scanPaths([root]);

  assert.equal(records.length, 1);
  assert.equal(records[0].relativePath, `${path.basename(root)}/docs/hello.txt`.replace(/\\/g, "/"));
  assert.equal(records[0].sizeBytes, 5);
});

test("creates a zip package with manifest artifacts", async () => {
  const root = await makeTempDir();
  const output = await makeTempDir();

  await fs.writeFile(path.join(root, "first.txt"), "alpha");
  await fs.writeFile(path.join(root, "second.txt"), "beta");

  const result = await createPackage({
    title: "Demo Pack",
    author: "Tester",
    note: "For test",
    outputDir: output,
    inputPaths: [root],
    appVersion: "0.1.0-test"
  });

  assert.equal(result.fileCount, 2);
  assert.match(path.basename(result.zipPath), /^demo-pack\.zip$/);

  const zipData = await fs.readFile(result.zipPath);
  const zip = await JSZip.loadAsync(zipData);
  const names = Object.keys(zip.files);

  assert(names.includes("manifest.csv"));
  assert(names.includes("checksums.sha256"));
  assert(names.includes("README.txt"));
  assert(names.includes("packledger-report.json"));
  assert(names.some((name) => name.endsWith("/first.txt")));
});
