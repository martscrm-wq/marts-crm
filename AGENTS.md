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
