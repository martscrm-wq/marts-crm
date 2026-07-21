# TestSprite Tests

This directory contains auto-generated TestSprite test cases.

## How to generate tests

1. Install TestSprite MCP Server in your IDE (Cursor/VS Code)
2. Open `Marts_System_Merged.html`
3. Run: "Generate tests for login, dashboard, and accounting"
4. TestSprite will open the browser and create tests automatically
5. Save generated files here

## Expected structure

```
testsprite_tests/
  test_login.py
  test_dashboard.py
  test_accounting.py
  ...
```

## CI/CD Integration

- On **Pull Request**: Tests run against Firebase preview URL
- On **Push to master**: Tests run against production URL
- Results appear as PR comments and GitHub Actions summaries

## Required Secrets

| Secret | Where |
|--------|-------|
| `TESTSPRITE_API_KEY` | GitHub → Settings → Secrets → Actions |
