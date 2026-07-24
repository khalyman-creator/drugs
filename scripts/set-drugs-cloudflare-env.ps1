# Set all RawDrop env on Cloudflare worker "drugs"
# Account: 80dde3ce8f942ae41c4ded3ff35ef2c6
#
# FIRST: log into the correct Cloudflare account:
#   npx wrangler login
# (Use the account that owns the "drugs" worker in the dashboard link you shared.)
#
# Optional Supabase (paste from Supabase → Settings → API):
#   $env:SUPABASE_URL = "https://YOUR_REF.supabase.co"
#   $env:SUPABASE_ANON = "eyJ..."
#   $env:SUPABASE_SERVICE = "eyJ..."
#
# Payment + email secrets (set before running, or paste into .dev.vars):
#   $env:NOWPAYMENTS_API_KEY = "..."
#   $env:NOWPAYMENTS_IPN_SECRET = "..."
#   $env:RESEND_API_KEY = "..."
#
# Then run:
#   .\scripts\set-drugs-cloudflare-env.ps1

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$authSecret = -join ((1..32 | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) }))
$adminPass = -join ((48..57 + 65..90 + 97..122 | Get-Random -Count 24 | ForEach-Object { [char]$_ }))

Write-Host "Generated ADMIN_PASSWORD (save this): $adminPass"
Write-Host ""

$secrets = @{
  AUTH_SECRET     = $authSecret
  ADMIN_PASSWORD  = $adminPass
}

if ($env:NOWPAYMENTS_API_KEY) { $secrets["NOWPAYMENTS_API_KEY"] = $env:NOWPAYMENTS_API_KEY }
if ($env:NOWPAYMENTS_IPN_SECRET) { $secrets["NOWPAYMENTS_IPN_SECRET"] = $env:NOWPAYMENTS_IPN_SECRET }
if ($env:RESEND_API_KEY) { $secrets["RESEND_API_KEY"] = $env:RESEND_API_KEY }
if ($env:SUPABASE_SERVICE) { $secrets["SUPABASE_SERVICE_ROLE_KEY"] = $env:SUPABASE_SERVICE }

foreach ($name in $secrets.Keys) {
  Write-Host "Setting secret $name ..."
  $secrets[$name] | npx wrangler secret put $name --name drugs
}

$siteUrl = $env:SITE_URL
if (-not $siteUrl) {
  $siteUrl = Read-Host "Workers URL (e.g. https://drugs.YOUR-SUBDOMAIN.workers.dev)"
}

$wranglerPath = Join-Path (Get-Location) "wrangler.jsonc"
$content = Get-Content $wranglerPath -Raw
$content = $content -replace '"NEXT_PUBLIC_SITE_URL"\s*:\s*"[^"]*"', "`"NEXT_PUBLIC_SITE_URL`": `"$siteUrl`""

if ($env:SUPABASE_URL -and $env:SUPABASE_ANON) {
  if ($content -match '"NEXT_PUBLIC_SUPABASE_URL"') {
    $content = $content -replace '"NEXT_PUBLIC_SUPABASE_URL"\s*:\s*"[^"]*"', "`"NEXT_PUBLIC_SUPABASE_URL`": `"$env:SUPABASE_URL`""
    $content = $content -replace '"NEXT_PUBLIC_SUPABASE_ANON_KEY"\s*:\s*"[^"]*"', "`"NEXT_PUBLIC_SUPABASE_ANON_KEY`": `"$env:SUPABASE_ANON`""
  } else {
    $content = $content -replace '("NEXT_PUBLIC_SITE_URL"\s*:\s*"[^"]+",)', "`$1`n    `"NEXT_PUBLIC_SUPABASE_URL`": `"$env:SUPABASE_URL`",`n    `"NEXT_PUBLIC_SUPABASE_ANON_KEY`": `"$env:SUPABASE_ANON`","
  }
}

Set-Content $wranglerPath $content -NoNewline

Write-Host ""
Write-Host "Plain vars (also set these in dashboard if not redeploying):"
Write-Host "  NEXT_PUBLIC_SITE_URL = $siteUrl"
Write-Host "  ADMIN_EMAIL = support@silkfreedom.com"
Write-Host "  EMAIL_FROM = onboarding@resend.dev"
if ($env:SUPABASE_URL) { Write-Host "  NEXT_PUBLIC_SUPABASE_URL = $env:SUPABASE_URL" }
if ($env:SUPABASE_ANON) { Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY = $env:SUPABASE_ANON" }

Write-Host ""
Write-Host "Done. Redeploy when ready: npm run deploy:cloudflare"
