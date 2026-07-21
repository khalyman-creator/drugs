# ONE-TIME SETUP — run SETUP.bat or: .\scripts\EASY-SETUP.ps1
# You only paste 2 keys from Supabase. Script does the rest.

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$ProjectUrl = "https://vjxjhwzfcdwuwhgiinrk.supabase.co"
$WorkerName = "drugs"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RawDrop — one-time setup (2 paste)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Start-Process "https://supabase.com/dashboard/project/vjxjhwzfcdwuwhgiinrk/settings/api-keys/legacy"

Write-Host "Your browser opened Supabase API keys." -ForegroundColor Yellow
Write-Host "Copy the two keys below (Reveal if needed):" -ForegroundColor Yellow
Write-Host ""

$anon = Read-Host "1) Paste ANON or PUBLISHABLE key (sb_publishable_... or eyJ...)"
$service = Read-Host "2) Paste SERVICE_ROLE key"

if (-not $anon -or -not $service) {
  Write-Host "Both keys are required. Run SETUP.bat again." -ForegroundColor Red
  exit 1
}

# Save locally (gitignored) for redeploys
$local = @{
  NEXT_PUBLIC_SUPABASE_URL = $ProjectUrl
  NEXT_PUBLIC_SUPABASE_ANON_KEY = $anon
  SUPABASE_SERVICE_ROLE_KEY = $service
}
$local | ConvertTo-Json | Set-Content ".rawdrop-supabase.json"

# Update wrangler.jsonc plain vars
$wranglerPath = Join-Path (Get-Location) "wrangler.jsonc"
$content = Get-Content $wranglerPath -Raw
$content = $content -replace '"NEXT_PUBLIC_SUPABASE_URL"\s*:\s*"[^"]*"', "`"NEXT_PUBLIC_SUPABASE_URL`": `"$ProjectUrl`""
if ($content -match '"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"') {
  $content = $content -replace '"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"\s*:\s*"[^"]*"', "`"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`": `"$anon`""
} elseif ($content -match '"NEXT_PUBLIC_SUPABASE_ANON_KEY"') {
  $content = $content -replace '"NEXT_PUBLIC_SUPABASE_ANON_KEY"\s*:\s*"[^"]*"', "`"NEXT_PUBLIC_SUPABASE_ANON_KEY`": `"$anon`""
} else {
  $content = $content -replace '("NEXT_PUBLIC_SUPABASE_URL"\s*:\s*"[^"]+",)', "`$1`n    `"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`": `"$anon`","
}
Set-Content $wranglerPath $content -NoNewline

Write-Host ""
Write-Host "Cloudflare login (pick the account that owns worker '$WorkerName')..." -ForegroundColor Yellow
npx wrangler login

Write-Host ""
Write-Host "Uploading Supabase secret to worker $WorkerName..." -ForegroundColor Green
$service | npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --name $WorkerName

# Payment + email secrets — read from environment (set these before running,
# or paste into .dev.vars) rather than hardcoding real keys in this script.
$optional = @{
  NOWPAYMENTS_API_KEY    = $env:NOWPAYMENTS_API_KEY
  NOWPAYMENTS_IPN_SECRET = $env:NOWPAYMENTS_IPN_SECRET
  RESEND_API_KEY         = $env:RESEND_API_KEY
}
foreach ($name in $optional.Keys) {
  if (-not $optional[$name]) {
    Write-Host "Skip $name (set `$env:$name before running to include it)"
    continue
  }
  Write-Host "Setting $name ..."
  $optional[$name] | npx wrangler secret put $name --name $WorkerName 2>$null
}

Write-Host ""
Write-Host "Building and deploying..." -ForegroundColor Green
npm run deploy:cloudflare

Write-Host ""
Write-Host "Done! Test:" -ForegroundColor Green
Write-Host "  https://drugs.khalyman-creator.workers.dev/api/public/store-config"
Write-Host "  (checkoutReady should be true)"
Write-Host ""
