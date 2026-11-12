import re
import os
from typing import Dict, Any

# Regex patterns for sensitive credentials
SENSITIVE_PATTERNS = [
    re.compile(r'(?i)(api[_-]?key|secret|token|password|auth|bearer|access[_-]?token)\s*[:=]\s*["\']?([a-zA-Z0-9_\-\.]{8,})["\']?'),
    re.compile(r'ghp_[a-zA-Z0-9]{36}'),  # GitHub PAT
    re.compile(r'gho_[a-zA-Z0-9]{36}'),  # GitHub OAuth
    re.compile(r'github_pat_[a-zA-Z0-9_]{82}'), # Fine-grained PAT
    re.compile(r'AIza[0-9A-Za-z-_]{35}'), # Google API Key
    re.compile(r'AQ\.[0-9A-Za-z-_]{30,}'), # Google GenAI Token / Key
    re.compile(r'-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+ PRIVATE KEY-----'),
]

# Prompt injection markers often planted in code comments
PROMPT_INJECTION_PATTERNS = [
    re.compile(r'(?i)ignore\s+(all\s+)?(previous|prior|above)\s+instructions'),
    re.compile(r'(?i)system\s*:\s*you\s+are\s+now'),
    re.compile(r'(?i)disregard\s+security\s+(rules|checks|guidelines)'),
    re.compile(r'(?i)mark\s+this\s+file\s+as\s+(clean|safe|no\s+vulnerabilities)'),
]

def redact_secrets(text: str) -> str:
    """Mask credentials and secrets in logs, reports, and agent transcripts."""
    if not isinstance(text, str):
        return text
    redacted = text
    for pattern in SENSITIVE_PATTERNS:
        redacted = pattern.sub("[REDACTED_CREDENTIAL]", redacted)
    return redacted

def sanitize_untrusted_code(code: str) -> str:
    """Detect and flag adversarial prompt injections placed inside code comments."""
    for pattern in PROMPT_INJECTION_PATTERNS:
        if pattern.search(code):
            # We neutralize the injection while preserving line layout
            code = pattern.sub("[POTENTIAL_PROMPT_INJECTION_FLAGGED_BY_SHADOW_CODE]", code)
    return code

def validate_safe_relative_path(base_dir: str, target_path: str) -> str:
    """
    Prevent directory traversal attacks. Ensures the resolved target path
    is strictly within base_dir.
    """
    resolved_base = os.path.realpath(base_dir)
    resolved_target = os.path.realpath(os.path.join(base_dir, target_path))
    if not (resolved_target == resolved_base or resolved_target.startswith(resolved_base + os.sep)):
        raise ValueError(f"Path traversal detected: {target_path} escapes {base_dir}")
    return resolved_target
