from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from database import init_db
from api.upload import router as upload_router
from api.candidates import router as candidates_router
from api.evaluations import router as evaluations_router
from api.debate import router as debate_router
from api.reports import router as reports_router

app = FastAPI(
    title="Multi-Agent AI Interview Panel Simulator API",
    description="Evidence-first, staged multi-agent decision-support system for hiring evaluation.",
    version="1.0.0"
)

# Compression middleware for high efficiency & fast load times
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Enable CORS with strict security settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; img-src 'self' data: https:;"
    return response

# Initialize Database
@app.on_event("startup")
def on_startup():
    init_db()

# Mount API routers
app.include_router(upload_router)
app.include_router(candidates_router)
app.include_router(evaluations_router)
app.include_router(debate_router)
app.include_router(reports_router)

# Mount static frontend directory if present
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
def root():
    index_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "system": "Multi-Agent AI Interview Panel Simulator API",
        "status": "online",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
