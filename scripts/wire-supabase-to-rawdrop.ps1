# Wire RawDrop Supabase keys to Cloudflare worker `rawdrop` only
#
# Get keys from Supabase Dashboard → your RawDrop project → Settings → API
#
# Usage:
#   .\scripts\wire-supabase-to-rawdrop.ps1 `
#     -Url "https://YOUR_REF.supabase.co" `
#     -AnonKey "eyJ..." `
#     -ServiceRoleKey "eyJ..."

param(
  [Parameter(Mandatory = $true)][string]$Url,
  [Parameter(Mandatory = $true)][string]$AnonKey,
  [Parameter(Mandatory = $true)][string]$ServiceRoleKey
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "Setting SUPABASE_SERVICE_ROLE_KEY on worker rawdrop..."
$ServiceRoleKey | npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --name rawdrop

$wranglerPath = Join-Path (Get-Location) "wrangler.jsonc"
$content = Get-Content $wranglerPath -Raw

if ($content -match '"NEXT_PUBLIC_SUPABASE_URL"') {
  $content = $content -replace '"NEXT_PUBLIC_SUPABASE_URL"\s*:\s*"[^"]*"', "`"NEXT_PUBLIC_SUPABASE_URL`": `"$Url`""
  $content = $content -replace '"NEXT_PUBLIC_SUPABASE_ANON_KEY"\s*:\s*"[^"]*"', "`"NEXT_PUBLIC_SUPABASE_ANON_KEY`": `"$AnonKey`""
} else {
  $content = $content -replace '("NEXT_PUBLIC_SITE_URL"\s*:\s*"[^"]+",)', "`$1`n    `"NEXT_PUBLIC_SUPABASE_URL`": `"$Url`",`n    `"NEXT_PUBLIC_SUPABASE_ANON_KEY`": `"$AnonKey`","
}

Set-Content $wranglerPath $content -NoNewline

Write-Host "Redeploying rawdrop from E: path..."
Set-Location "E:\LaptopArchive\Downloads\new app"
npm run deploy:cloudflare

Write-Host ""
Write-Host "Verify store-config on your deployed worker URL"
Write-Host "Expect checkoutReady: true"
