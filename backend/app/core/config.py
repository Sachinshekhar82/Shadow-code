import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        extra="allow",
        env_ignore_empty=True
    )

    PROJECT_NAME: str = "Shadow-Code"
    PROJECT_TITLE: str = "Shadow-Code: Agentic AI-Powered Secure SDLC Auditor"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server & Security
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]
    SECRET_KEY: str = Field(default="dev-insecure-secret-key-change-in-production")

    # Database (MongoDB)
    MONGODB_URI: str = Field(default=os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
    MONGODB_DATABASE: str = Field(default=os.getenv("MONGODB_DATABASE", os.getenv("MONGODB_DB_NAME", "shadow_code")))
    MONGODB_DB_NAME: str = Field(default=os.getenv("MONGODB_DATABASE", os.getenv("MONGODB_DB_NAME", "shadow_code")))

    # GitHub Integration
    GITHUB_TOKEN: str = Field(default=os.getenv("GITHUB_TOKEN", ""))
    GITHUB_REPOSITORY: str = Field(default=os.getenv("GITHUB_REPOSITORY", "Sachinshekhar82/Shadow-code"))
    GITHUB_WEBHOOK_SECRET: str = Field(default=os.getenv("GITHUB_WEBHOOK_SECRET", "shadow-code-webhook-secret"))
    DEFAULT_REPO_URL: str = "https://github.com/Sachinshekhar82/Shadow-code.git"

    # AI & Google Gemini Official Engine
    GEMINI_API_KEY: str = Field(default=os.getenv("GEMINI_API_KEY", os.getenv("LLM_API_KEY", "")))
    GEMINI_MODEL: str = Field(default=os.getenv("GEMINI_MODEL", os.getenv("LLM_MODEL", "gemini-2.5-flash")))
    LLM_PROVIDER: str = Field(default=os.getenv("LLM_PROVIDER", "gemini"))
    LLM_API_KEY: str = Field(default=os.getenv("GEMINI_API_KEY", os.getenv("LLM_API_KEY", "")))
    LLM_MODEL: str = Field(default=os.getenv("GEMINI_MODEL", os.getenv("LLM_MODEL", "gemini-2.5-flash")))
    MAX_RETRY_LIMIT: int = 3
    GEMINI_REQUEST_TIMEOUT_SECONDS: int = 45

    # Scanner Settings
    ENABLE_SEMGREP: bool = True
    ENABLE_BANDIT: bool = True
    SCAN_TIMEOUT_SECONDS: int = 120
    WORKSPACE_ROOT: str = Field(default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

settings = Settings()
