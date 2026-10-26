# ===================================================================
#  dev.ps1  -  Start both servers for local development
#  Usage: .\dev.ps1
#  Press Ctrl+C to stop both processes.
# ===================================================================

Write-Host ""
Write-Host "=== AI-Powered Prep Manager - Dev Launcher ===" -ForegroundColor Cyan
Write-Host ""

# ── 1. FastAPI Backend (port 8000) ──────────────────────────────────
Write-Host "[Backend] Starting FastAPI on http://localhost:8000 ..." -ForegroundColor Green
 = Join-Path  "backend"
 = Start-Job -ScriptBlock {
    param()
    Set-Location 
    # Try project-level .venv first, then the venv inside /backend
     = if (Test-Path "..\\.venv\\Scripts\\Activate.ps1") {
        "..\\.venv\\Scripts\\Activate.ps1"
    } elseif (Test-Path ".\\venv\\Scripts\\Activate.ps1") {
        ".\\venv\\Scripts\\Activate.ps1"
    } else {  }

    if () { &  }
    python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload --app-dir ..
} -ArgumentList 

Write-Host "[Backend] Job started (ID: )" -ForegroundColor DarkGreen

Start-Sleep -Seconds 2

# ── 2. Next.js Frontend (port 3000) ─────────────────────────────────
Write-Host "[Frontend] Starting Next.js on http://localhost:3000 ..." -ForegroundColor Yellow
 = Join-Path  "frontend"
 = Start-Job -ScriptBlock {
    param()
    Set-Location 
    npm run dev
} -ArgumentList 

Write-Host "[Frontend] Job started (ID: )" -ForegroundColor DarkYellow
Write-Host ""
Write-Host "Both servers are starting up." -ForegroundColor Cyan
Write-Host "  Backend  -> http://localhost:8000/docs  (FastAPI Swagger UI)" -ForegroundColor Green
Write-Host "  Frontend -> http://localhost:3000       (Next.js App)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop both." -ForegroundColor Gray
Write-Host ""

# ── Stream output from both jobs ────────────────────────────────────
try {
    while (True) {
        Receive-Job -Job   | ForEach-Object { Write-Host "[backend]  "  -ForegroundColor DarkGreen }
        Receive-Job -Job  | ForEach-Object { Write-Host "[frontend] " -ForegroundColor DarkYellow }
        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host "
Shutting down..." -ForegroundColor Red
    Stop-Job  -Job , 
    Remove-Job -Job ,  -Force
}
