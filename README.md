# PackLedger

PackLedger is a local desktop tool for building submission-ready ZIP packages with a file manifest and SHA-256 checksums.

It is useful when you need to send homework, application materials, meeting documents, or review packages and want the receiver to verify exactly what was included.

## Features

- Add files or folders from your computer.
- Preview file count, total size, relative paths, and SHA-256 hashes.
- Generate a ZIP package containing:
  - `files/` with the selected files
  - `manifest.csv`
  - `checksums.sha256`
  - `README.txt`
  - `packledger-report.json`
- Skip common system files such as `.DS_Store`, `Thumbs.db`, and `desktop.ini`.
- Keep processing local. PackLedger does not upload your files.

## Install and Run

```bash
npm install
npm start
```

## Build

```bash
npm run build
npm run dist:win
```

The Windows portable build is written to `release/`.

## Development

```bash
npm test
npm run check
```

PackLedger uses Electron with `contextIsolation` enabled. File access and package creation run in the main process through a narrow preload API.

The CI workflow template is documented in [docs/CI_WORKFLOW_TEMPLATE.md](docs/CI_WORKFLOW_TEMPLATE.md).

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md).

## Maintenance

- Release checklist: [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md)
- Support policy: [SUPPORT.md](SUPPORT.md)
- Security policy: [SECURITY.md](SECURITY.md)

## 中文简介

PackLedger 是一个本地桌面工具，用来把作业、报名材料、会议资料等文件打成 ZIP 包，并自动生成文件清单和 SHA-256 校验码。所有文件处理都在本机完成，不上传资料。

## License

MIT
