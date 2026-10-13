from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class RepositoryCreateRequest(BaseModel):
    name: str
    url: str
    default_branch: str = "main"
    integration_mode: str = "local_demo"

class RepositoryResponse(BaseModel):
    id: str
    name: str
    url: str
    default_branch: str
    integration_mode: str
    status: str
    scan_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SystemStatusResponse(BaseModel):
    mode: str
    scanners_available: dict
    llm_configured: bool
    llm_provider: Optional[str]
    nvd_configured: bool
    github_configured: bool
    active_repository: Optional[str]
    version: str = "1.0.0"

class SampleCodeResponse(BaseModel):
    vulnerable_code: str
    clean_code: str
    vulnerable_filename: str
    clean_filename: str
    vulnerabilities_explained: List[dict]
