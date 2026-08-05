param(
    [string]$Action = "guard"  # guard | backup | check | full
)

$root = "C:\Users\khelw\Downloads\CRM"
$main = Join-Path $root "Marts_System_Merged.html"
$pub = Join-Path $root "public\Marts_System_Merged.html"
$baks = Join-Path $root "backups"
$tmp = "C:\Users\khelw\AppData\Local\Temp\opencode"

function New-Backup {
    param([string]$File)
    $ver = Get-Date -Format "yyyyMMdd-HHmmss"
    $bak = "$File.bak_$ver"
    Copy-Item -LiteralPath $File -Destination $bak -Force
    Write-Output "BACKUP: $bak"
    return $bak
}

function Test-JsSyntax {
    $html = [System.IO.File]::ReadAllText($main)
    $matches = [regex]::Matches($html, '<script[^>]*>([\s\S]*?)</script>')
    $js = $matches[$matches.Count - 1].Groups[1].Value
    $jsFile = Join-Path $tmp "live_script.js"
    [System.IO.File]::WriteAllText($jsFile, $js, (New-Object System.Text.UTF8Encoding($true)))
    node --check $jsFile 2>&1
    if ($LASTEXITCODE -eq 0) { Write-Output "SYNTAX OK ($($js.Length) chars)" } else { Write-Output "SYNTAX ERROR"; exit 1 }
}

function Test-Jest {
    Push-Location $root
    npx jest --ci 2>&1 | Select-Object -Last 4
    Pop-Location
}

switch ($Action) {
    "backup" {
        New-Backup $main
        New-Backup $pub
    }
    "check" {
        Test-JsSyntax
        Test-Jest
    }
    "full" {
        New-Backup $main
        New-Backup $pub
        Test-JsSyntax
        Test-Jest
    }
    default {
        Write-Output "Usage: guard.ps1 -Action backup|check|full"
    }
}
