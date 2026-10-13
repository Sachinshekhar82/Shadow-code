import os
import shutil
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.schemas.repository import SystemStatusResponse, SampleCodeResponse
from backend.samples.sample_meta import DEMO_VULNERABILITIES

router = APIRouter(prefix="/api", tags=["System"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Shadow Code Agentic Security Gateway",
        "version": "1.0.0",
        "institution": "Dayananda Sagar Academy of Technology & Management",
        "department": "CSE - Cyber Security"
    }

@router.get("/status", response_model=SystemStatusResponse)
def get_system_status():
    bandit_path = shutil.which("bandit") or os.path.exists(
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "venv", "Scripts", "bandit.exe"))
    )
    semgrep_path = shutil.which("semgrep")

    llm_key = os.environ.get("LLM_API_KEY", "")
    llm_provider = os.environ.get("LLM_PROVIDER", "")
    nvd_key = os.environ.get("NVD_API_KEY", "")
    gh_token = os.environ.get("GITHUB_TOKEN", "")

    return SystemStatusResponse(
        mode=os.environ.get("SHADOW_CODE_MODE", "demo"),
        scanners_available={
            "bandit": bool(bandit_path),
            "semgrep": bool(semgrep_path),
            "python_ast": True,
            "regex_sast": True
        },
        llm_configured=bool(llm_key and llm_provider),
        llm_provider=llm_provider if llm_key else None,
        nvd_configured=bool(nvd_key),
        github_configured=bool(gh_token),
        active_repository="https://github.com/Sachinshekhar82/Shadow-code.git",
        version="1.0.0"
    )

@router.get("/samples", response_model=SampleCodeResponse)
def get_sample_codes():
    vuln_path = os.path.join(os.path.dirname(__file__), "..", "samples", "vulnerable_app.py")
    clean_path = os.path.join(os.path.dirname(__file__), "..", "samples", "clean_app.py")

    with open(vuln_path, "r", encoding="utf-8") as f:
        v_code = f.read()
    with open(clean_path, "r", encoding="utf-8") as f:
        c_code = f.read()

    return SampleCodeResponse(
        vulnerable_code=v_code,
        clean_code=c_code,
        vulnerable_filename="vulnerable_app.py",
        clean_filename="clean_app.py",
        vulnerabilities_explained=DEMO_VULNERABILITIES
    )

@router.get("/diagrams/{name}")
def get_diagram_asset(name: str):
    diagrams_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "docs", "reference", "diagrams"))
    target = os.path.join(diagrams_dir, name)
    if not os.path.exists(target):
        raise HTTPException(status_code=404, detail="Diagram asset not found")
    return FileResponse(target, media_type="image/png")
