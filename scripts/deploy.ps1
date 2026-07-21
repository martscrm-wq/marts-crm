# deploy.ps1 - Local CI/CD deploy script for Marts System
# Usage:
#   .\scripts\deploy.ps1                    # Deploy with current version
#   .\scripts\deploy.ps1 -Version "2.1.0"  # Bump version and deploy
#   .\scripts\deploy.ps1 -ValidateOnly     # Just validate, no deploy

param(
    [string]$Version,
    [switch]$ValidateOnly,
    [switch]$SkipFunctions
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $PSScriptRoot
$HtmlFile = Join-Path $ProjectDir "Marts_System_Merged.html"
$SwFile = Join-Path $ProjectDir "sw.js"
$ManifestFile = Join-Path $ProjectDir "manifest.json"
$PublicDir = Join-Path $ProjectDir "public"

function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-OK($msg)   { Write-Host "   OK: $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "   FAIL: $msg" -ForegroundColor Red }

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Marts System CI/CD Deploy" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

# ── Step 1: Validate JavaScript ──
Write-Step "Validating JavaScript syntax..."

$validateResult = node -e @"
const fs = require('fs');
const html = fs.readFileSync('$($HtmlFile.Replace('\','/'))', 'utf8');
const scripts = [];
let idx = 0;
while (true) {
  const start = html.indexOf('<script', idx);
  if (start === -1) break;
  const tagEnd = html.indexOf('>', start);
  const end = html.indexOf('</script>', tagEnd);
  if (end === -1) break;
  scripts.push(html.substring(tagEnd + 1, end));
  idx = end + 9;
}
let hasError = false;
scripts.forEach((code, i) => {
  if (code.trim().length === 0) return;
  try { require('vm').compileFunction(code); console.log('Block ' + i + ': OK'); }
  catch(e) { console.error('Block ' + i + ': FAIL - ' + e.message); hasError = true; }
});
if (hasError) process.exit(1);
console.log('All script blocks valid');
"@

if ($LASTEXITCODE -ne 0) {
    Write-Fail "JavaScript validation failed!"
    exit 1
}
Write-OK "JavaScript validation passed"

# ── Step 2: Validate HTML structure ──
Write-Step "Validating HTML structure..."

node -e @"
const fs = require('fs');
const html = fs.readFileSync('$($HtmlFile.Replace('\','/'))', 'utf8');
const fail = !html.includes('<html') || !html.includes('</html>') ||
             !html.includes('<body') || !html.includes('</body>') ||
             !html.includes('FIREBASE_CONFIG') || !html.includes('function doLogin');
if (fail) { console.error('HTML validation failed'); process.exit(1); }
console.log('HTML structure OK');
"@

if ($LASTEXITCODE -ne 0) {
    Write-Fail "HTML validation failed!"
    exit 1
}
Write-OK "HTML structure valid"

# ── Step 3: Get/Bump version ──
Write-Step "Checking SYSTEM_VERSION..."

$CurrentVersion = node -e @"
const fs = require('fs');
const html = fs.readFileSync('$($HtmlFile.Replace('\','/'))', 'utf8');
const m = html.match(/SYSTEM_VERSION\s*=\s*'([^']+)'/);
console.log(m ? m[1] : '0.0.0');
"@
$CurrentVersion = $CurrentVersion.Trim()
Write-OK "Current version: $CurrentVersion"

if ($Version) {
    Write-Step "Bumping version: $CurrentVersion -> $Version"
    $content = Get-Content $HtmlFile -Raw
    $content = $content -replace "SYSTEM_VERSION\s*=\s*'$CurrentVersion'", "SYSTEM_VERSION = '$Version'"
    Set-Content $HtmlFile -Value $content -NoNewline
    $CurrentVersion = $Version
    Write-OK "Version bumped to $Version"
}

if ($ValidateOnly) {
    Write-Host "`nValidation complete. No deploy performed." -ForegroundColor Yellow
    exit 0
}

# ── Step 4: Prepare public directory ──
Write-Step "Preparing build..."
if (Test-Path $PublicDir) { Remove-Item $PublicDir -Recurse -Force }
New-Item -ItemType Directory -Path $PublicDir -Force | Out-Null

Copy-Item $HtmlFile (Join-Path $PublicDir "index.html")
Copy-Item $SwFile (Join-Path $PublicDir "sw.js")
Copy-Item $ManifestFile (Join-Path $PublicDir "manifest.json")
Copy-Item (Join-Path $ProjectDir "icon-192.svg") (Join-Path $PublicDir "icon-192.svg") -ErrorAction SilentlyContinue

$files = Get-ChildItem $PublicDir
Write-OK "Built $($files.Count) files in public/"

# ── Step 5: Deploy to Firebase Hosting ──
Write-Step "Deploying to Firebase Hosting..."
firebase deploy --only hosting
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Firebase Hosting deploy failed!"
    exit 1
}
Write-OK "Hosting deployed successfully"

# ── Step 6: Deploy Cloud Functions ──
if (-not $SkipFunctions) {
    Write-Step "Deploying Cloud Functions..."
    Push-Location (Join-Path $ProjectDir "functions")
    if (-not (Test-Path "node_modules")) {
        Write-Host "   Installing dependencies..."
        npm install --production 2>&1 | Out-Null
    }
    Pop-Location

    firebase deploy --only functions
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Functions deploy failed!"
        exit 1
    }
    Write-OK "Cloud Functions deployed"
}

# ── Step 7: Update Firestore version ──
Write-Step "Updating Firestore version doc..."
firebase firestore:update system_config/version --data "{""version"": ""$CurrentVersion"", ""deployedBy"": ""local"", ""updatedAt"": $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')}" 2>&1 | Out-Null
Write-OK "Firestore version updated to $CurrentVersion"

# ── Summary ──
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Deploy Complete!" -ForegroundColor Green
Write-Host "  Version: $CurrentVersion" -ForegroundColor Green
Write-Host "  URL: https://marts-crm-6ca37.web.app" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
