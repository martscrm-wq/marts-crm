powershell -Command "
$htmlPath = 'C:\Users\khelw\Downloads\CRM\Marts_System_Merged.html'
$content = Get-Content -Raw $htmlPath
$content = $content -replace '\.jpeg', '.png'
$content = $content -replace 'src=\"LogoMarts\.jpeg', 'src=\"LogoMarts.png'
$content = $content -replace 'href=\"LogoMarts\.jpeg', 'href=\"LogoMarts.png'
$content = $content -replace 'LogoMarts\.jpeg\\?v=', 'LogoMarts.png'
Set-Content -Path $htmlPath -Value $content -Encoding UTF8
Write-Host 'Updated all logo references to LogoMarts.png'
"