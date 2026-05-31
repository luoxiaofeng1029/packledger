# Release Checklist

Use this checklist for each PackLedger release.

1. Update `CHANGELOG.md`.
2. Run `npm ci`.
3. Run `npm run build`.
4. Run `npm run dist:win`.
5. Manually create a package from a small sample folder.
6. Confirm the ZIP contains `manifest.csv`, `checksums.sha256`, `README.txt`, and `packledger-report.json`.
7. Create a Git tag such as `v0.1.0`.
8. Create a GitHub Release and attach the Windows portable executable.
9. Move unresolved release blockers back to the roadmap or open follow-up issues.
