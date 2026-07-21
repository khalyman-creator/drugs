# Finish RawDrop deploy after Supabase project exists
# Run from: E:\LaptopArchive\Downloads\new app
#
# Prerequisites:
#   1. npx supabase login
#   2. node scripts/setup-rawdrop-supabase.mjs
#   3. Fill values below from .rawdrop-supabase.json

param(
  [string]$SupabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL,
  [string]$SupabaseAnon = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY,
  [string]$SupabaseService = $env:SUPABASE_SERVICE_ROLE_KEY
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot + "\.."

$configPath = Join-Path (Get-Location) ".rawdrop-supabase.json"
if (Test-Path $configPath) {
  $cfg = Get-Content $configPath | ConvertFrom-Json
  if (-not $SupabaseUrl) { $SupabaseUrl = $cfg.NEXT_PUBLIC_SUPABASE_URL }
  if (-not $SupabaseAnon) { $SupabaseAnon = $cfg.NEXT_PUBLIC_SUPABASE_ANON_KEY }
  if (-not $SupabaseService) { $SupabaseService = $cfg.SUPABASE_SERVICE_ROLE_KEY }
}

if (-not $SupabaseUrl -or -not $SupabaseAnon -or -not $SupabaseService) {
  Write-Error "Missing Supabase keys. Run setup-rawdrop-supabase.mjs first or pass env vars."
}

Write-Host "Setting SUPABASE_SERVICE_ROLE_KEY secret on worker rawdrop..."
$SupabaseService | npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --name rawdrop

Write-Host "Updating wrangler plain vars..."
$wranglerPath = Join-Path (Get-Location) "wrangler.jsonc"
$content = Get-Content $wranglerPath -Raw
$content = $content -replace '"NEXT_PUBLIC_SUPABASE_URL"\s*:\s*"[^"]*"', ""
$content = $content -replace '"NEXT_PUBLIC_SUPABASE_ANON_KEY"\s*:\s*"[^"]*"', ""
if ($content -notmatch "NEXT_PUBLIC_SUPABASE_URL") {
  $content = $content -replace '("NEXT_PUBLIC_SITE_URL":\s*"[^"]+",)', "`$1`n    `"NEXT_PUBLIC_SUPABASE_URL`": `"$SupabaseUrl`",`n    `"NEXT_PUBLIC_SUPABASE_ANON_KEY`": `"$SupabaseAnon`","
}
Set-Content $wranglerPath $content -NoNewline

Write-Host "Redeploying rawdrop..."
npm run deploy:cloudflare

Write-Host "Done. Verify:"
Write-Host "  curl YOUR_WORKER_URL/api/public/store-config"
