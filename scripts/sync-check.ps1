$root = "C:\Users\khelw\Downloads\CRM"
$main = Join-Path $root "Marts_System_Merged.html"
$pub = Join-Path $root "public\Marts_System_Merged.html"
$r = (Get-Item -LiteralPath $main).Length
$p = (Get-Item -LiteralPath $pub).Length
$same = $r -eq $p
Write-Output ("root:  {0} bytes" -f $r)
Write-Output ("public: {0} bytes" -f $p)
if ($same) {
    $h1 = (Get-FileHash -LiteralPath $main).Hash
    $h2 = (Get-FileHash -LiteralPath $pub).Hash
    if ($h1 -eq $h2) { Write-Output "MATCH: identical" } else { Write-Output "DIFFER: same size but different content"; exit 1 }
} else {
    Write-Output "DIFFER: sizes differ - public copy is stale. Sync before deploy."; exit 1
}
