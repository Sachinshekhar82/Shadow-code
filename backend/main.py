import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database.session import engine, Base, SessionLocal
from backend.database.models import Repository, Scan
from backend.pipeline.orchestrator import ShadowCodeOrchestrator

from backend.api.routes_scans import router as scans_router
from backend.api.routes_findings import router as findings_router
from backend.api.routes_remediation import router as remediation_router
from backend.api.routes_memory import router as memory_router
from backend.api.routes_repos import router as repos_router
from backend.api.routes_system import router as system_router

# Create DB tables
Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure at least one sample repository and an initial baseline demo scan exists."""
    db = SessionLocal()
    try:
        repo = db.query(Repository).filter(Repository.id == "repo-demo").first()
        if not repo:
            repo = Repository(
                id="repo-demo",
                name="Shadow-Code Core Gateway",
                url="https://github.com/Sachinshekhar82/Shadow-code.git",
                default_branch="main",
                integration_mode="local_demo",
                status="connected",
                scan_count=0
            )
            db.add(repo)
            db.commit()

        # Seed an initial scan if empty
        scan_count = db.query(Scan).count()
        if scan_count == 0:
            sample_path = os.path.join(os.path.dirname(__file__), "samples", "vulnerable_app.py")
            if os.path.exists(sample_path):
                with open(sample_path, "r", encoding="utf-8") as f:
                    sample_code = f.read()
                orchestrator = ShadowCodeOrchestrator(db)
                orchestrator.execute_scan(
                    code=sample_code,
                    language="python",
                    filename="vulnerable_app.py",
                    repository_id="repo-demo",
                    scan_mode="local_demo",
                    branch="main",
                    commit_hash="f4d92a1",
                    commit_message="Initial baseline commit: Payment handler & Diagnostic service",
                    author="Sachin Shekhar (Demo)"
                )
    finally:
        db.close()
    yield

app = FastAPI(
    title="SHADOW CODE: Agentic AI Security Auditing Gateway",
    description="Autonomous 8-Agent DevSecOps security layer between local Git commits and remote repositories.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(system_router)
app.include_router(scans_router)
app.include_router(findings_router)
app.include_router(remediation_router)
app.include_router(memory_router)
app.include_router(repos_router)

@app.get("/api/info")
def root_info():
    return {
        "project": "SHADOW CODE",
        "tagline": "Agentic AI Framework for Autonomous Secure SDLC Auditing",
        "institution": "Dayananda Sagar Academy of Technology & Management",
        "department": "Department of CSE–Cyber Security",
        "team": [
            "Sachin Shekhar (1DT23CY040)",
            "Abhinav Raj (1DT23CY002)",
            "Ikshit Sinha (1DT23CY022)",
            "Abhishek Anand (1DT23CY003)"
        ],
        "guide": "Mr. Anitha R, Associate Professor",
        "github": "https://github.com/Sachinshekhar82/Shadow-code.git",
        "api_docs": "/docs",
        "health": "/api/health"
    }

# Mount static frontend build if present
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def fallback_root():
        return root_info()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
