# Push secrets from .dev.vars to Cloudflare worker "drugs"
# Run AFTER: npx wrangler login  (account 80dde3ce8f942ae41c4ded3ff35ef2c6)
#
#   .\scripts\push-cloudflare-secrets.ps1

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$devVars = Join-Path (Get-Location) ".dev.vars"
if (-not (Test-Path $devVars)) {
  Write-Error ".dev.vars not found. Run setup first."
}

$envMap = @{}
Get-Content $devVars | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $i = $line.IndexOf("=")
  if ($i -lt 1) { return }
  $envMap[$line.Substring(0, $i)] = $line.Substring($i + 1)
}

$secretNames = @(
  "SUPABASE_SERVICE_ROLE_KEY",
  "NOWPAYMENTS_API_KEY",
  "NOWPAYMENTS_IPN_SECRET",
  "RESEND_API_KEY"
)

foreach ($name in $secretNames) {
  if (-not $envMap[$name]) {
    Write-Host "Skip $name (not in .dev.vars)"
    continue
  }
  Write-Host "Setting secret $name on worker drugs..."
  $envMap[$name] | npx wrangler secret put $name --name drugs
}

Write-Host ""
Write-Host "Done. Redeploy: npm run deploy:cloudflare"
Write-Host "Then check: https://drugs.khalyman-creator.workers.dev/api/public/store-config"
