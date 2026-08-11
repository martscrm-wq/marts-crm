# Marts CRM/ERP Project

## CI/CD Requirements
After EVERY modification step, run these tests:

```bash
# 1. CRM unit tests (70 tests)
cd C:\Users\khelw\Downloads\CRM && npx jest --ci

# 2. CI/CD pipeline unit tests (56 tests)
cd C:\cicd-pipeline && npx jest --selectProjects unit
```

## Deploy
Vercel (not auto-linked to git — must deploy manually):
```bash
cd C:\Users\khelw\Downloads\CRM\public && npx vercel --prod --token $env:VERCEL_TOKEN --yes
```
> **WARNING:** The Vercel token was previously hardcoded here and has been removed for security.
> Set the `VERCEL_TOKEN` environment variable before deploying.
> The old token should be rotated at https://vercel.com/account/tokens

## Key Files
- Main: `C:\Users\khelw\Downloads\CRM\Marts_System_Merged.html`
- Deploy: `C:\Users\khelw\Downloads\CRM\public\` (synced via copy)
- CI/CD Pipeline: `C:\cicd-pipeline\`
- System clock is 2026 — Firebase SA key auth fails, use `_loadFailed` guard

## Data Safety (CRITICAL — multiple departments write data live)
- Cloud data is the source of truth: Firestore `marts-crm-v2` (collections: `app_data`, `activity_logs`, `app_data_backup`, `system_config`). Old project `marts-crm-6ca37` is deprecated (quota exhausted).
- Daily automatic backup: Task `MartsCRM_CloudBackup` runs `scripts\run-backup.bat` at 01:00. Manual run: `node backup_cloud_v2.js` -> `backups\cloud-backup-*.json` (keeps latest 14).
- NEVER touch `STORAGE.set`/`saveSale`/data-write functions without creating a `.bak` copy first.
- `backups/` and `test-results/` are gitignored (backups stay local on disk).
- `sa-key.json` and `marts-crm-v2-firebase-adminsdk*.json` are gitignored — never commit or print them.

## Code Safety (before/after EVERY edit)
1. Create a backup copy first: `Copy-Item Marts_System_Merged.html Marts_System_Merged.html.bak_<version>`
2. Extract JS and syntax-check after edits: see `scripts\` / run `node --check` on extracted script.
3. Run jest (83 tests) before deploying.
4. Commit after each completed task with a clear message → every step is revertible via `git revert`/`git checkout`.
5. Mirror edits in BOTH `Marts_System_Merged.html` (root) and `public\Marts_System_Merged.html` so the deploy copy never goes stale.
