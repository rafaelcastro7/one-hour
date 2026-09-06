# Redeploys the frontend and prints the new public URL.
#
# Why Docker: Vercel creates symlinks when bundling serverless functions,
# and Windows refuses them without admin rights or Developer Mode (EPERM).
# Building inside a Linux container sidesteps that entirely.
#
# Usage:  powershell -ExecutionPolicy Bypass -File redeploy.ps1

$ErrorActionPreference = "Stop"

$ProjectPath = "E:\dev\Jarvis\burningtoken\app"
$ConvexProdUrl = "https://energized-retriever-599.convex.cloud"

Write-Host "Building in Linux container and deploying..." -ForegroundColor Cyan

$output = docker run --rm `
  -v "${ProjectPath}:/app" `
  -w /app `
  -e NEXT_PUBLIC_CONVEX_URL="$ConvexProdUrl" `
  node:22-alpine `
  sh -c "rm -rf .vercel .next 2>/dev/null; npx --yes vercel@latest deploy --temporary --yes 2>&1"

$output | Select-Object -Last 30

$url = $output | Select-String -Pattern "https://[a-z0-9-]+\.vercel\.app" | ForEach-Object { $_.Matches[0].Value } | Select-Object -First 1
$claim = $output | Select-String -Pattern "https://vercel\.com/claim-deployment\?code=[a-f0-9-]+" | ForEach-Object { $_.Matches[0].Value } | Select-Object -First 1

Write-Host ""
if ($url) {
  Write-Host "LIVE URL:   $url" -ForegroundColor Green
  Write-Host "CLAIM LINK: $claim" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Temporary deployments expire in about an hour. Claim it to keep" -ForegroundColor DarkGray
  Write-Host "the URL permanent -- a URL that changes is no use on the form." -ForegroundColor DarkGray

  # Alpine (musl) strips glibc platform markers from the lockfile; don't let
  # that leak into a commit, since Render builds on glibc.
  Push-Location $ProjectPath
  git checkout -- package-lock.json 2>$null
  Pop-Location
} else {
  Write-Host "Deploy failed - see output above." -ForegroundColor Red
  exit 1
}
