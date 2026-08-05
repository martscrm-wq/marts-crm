# Sync root -> public, then verify
Copy-Item -LiteralPath "C:\Users\khelw\Downloads\CRM\Marts_System_Merged.html" -Destination "C:\Users\khelw\Downloads\CRM\public\Marts_System_Merged.html" -Force
& "C:\Users\khelw\Downloads\CRM\scripts\sync-check.ps1"
