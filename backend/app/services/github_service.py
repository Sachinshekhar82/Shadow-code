import logging
from typing import Dict, Any, Optional
from github import Github, Auth, GithubException
from backend.app.core.config import settings
from backend.app.core.security import redact_secrets

logger = logging.getLogger("shadow_code.services.github")

class GitHubIntegrationService:
    """
    Manages GitHub API interactions including connectivity testing,
    metadata retrieval, branch creation, and Pull Request staging.
    Never exposes or logs the GitHub token.
    """

    def _get_client(self) -> Optional[Github]:
        if not settings.GITHUB_TOKEN:
            return None
        auth = Auth.Token(settings.GITHUB_TOKEN)
        return Github(auth=auth)

    def test_connectivity(self) -> Dict[str, Any]:
        """
        Validates GitHub authentication and retrieves repository metadata
        without ever printing or exposing the access token.
        """
        if not settings.GITHUB_TOKEN:
            return {
                "status": "unconfigured",
                "authenticated": False,
                "message": "GITHUB_TOKEN is not configured in backend environment (.env).",
                "repository": settings.GITHUB_REPOSITORY
            }

        try:
            gh = self._get_client()
            if not gh:
                return {"status": "unconfigured", "authenticated": False}

            # Retrieve authenticated user info (without token)
            user = gh.get_user()
            user_login = user.login

            # Retrieve configured repository metadata
            repo = gh.get_repo(settings.GITHUB_REPOSITORY)

            # Determine permissions
            perms = repo.permissions
            perm_dict = {
                "admin": getattr(perms, "admin", False),
                "push": getattr(perms, "push", False),
                "pull": getattr(perms, "pull", True)
            }

            api_calls_verified = ["read_repository_metadata"]
            api_calls_missing_or_restricted = []

            # 1. Test branch inspection
            try:
                repo.get_branch(repo.default_branch)
                api_calls_verified.append("read_branch_metadata")
            except GithubException as ge:
                if ge.status == 404 and "Branch not found" in str(ge):
                    api_calls_verified.append("read_branch_metadata (repo is empty; initial commit pending)")
                else:
                    api_calls_missing_or_restricted.append("read_branch_metadata")
            except Exception:
                api_calls_missing_or_restricted.append("read_branch_metadata")

            # 2. Test repository contents / file tree access
            try:
                repo.get_contents("")
                api_calls_verified.append("read_repository_contents")
            except GithubException as ge:
                if ge.status == 404 and "This repository is empty" in str(ge):
                    api_calls_verified.append("read_repository_contents (repo is empty; initial commit pending)")
                else:
                    api_calls_missing_or_restricted.append("read_repository_contents")
            except Exception:
                api_calls_missing_or_restricted.append("read_repository_contents")

            # 3. Test pull request listing
            try:
                _ = [p for i, p in enumerate(repo.get_pulls(state="open")) if i < 5]
                api_calls_verified.append("query_pull_requests")
            except Exception as e:
                api_calls_missing_or_restricted.append(f"query_pull_requests ({type(e).__name__})")

            # 4. Check push / write permission
            if perm_dict["push"]:
                api_calls_verified.append("create_branch_and_push")
            else:
                api_calls_missing_or_restricted.append("create_branch_and_push (write/push permission missing)")

            # 5. Test webhook administration access
            try:
                _ = [h for i, h in enumerate(repo.get_hooks()) if i < 5]
                api_calls_verified.append("manage_webhooks")
            except Exception as e:
                api_calls_missing_or_restricted.append(f"manage_webhooks ({type(e).__name__})")

            # Missing permissions list
            missing_permissions = []
            if not perm_dict["pull"]:
                missing_permissions.append("pull (read access)")
            if not perm_dict["push"]:
                missing_permissions.append("push (write access)")
            if not perm_dict["admin"]:
                missing_permissions.append("admin (repository administration)")

            return {
                "status": "connected",
                "authenticated": True,
                "user": user_login,
                "repository": {
                    "full_name": repo.full_name,
                    "default_branch": repo.default_branch,
                    "private": repo.private,
                    "html_url": repo.html_url,
                    "open_issues_count": repo.open_issues_count,
                    "permissions": perm_dict
                },
                "api_calls_verified": api_calls_verified,
                "api_calls_missing_or_restricted": api_calls_missing_or_restricted,
                "missing_permissions": missing_permissions,
                "message": f"Successfully authenticated as '{user_login}' with access to '{repo.full_name}'."
            }
        except GithubException as ge:
            sanitized_err = redact_secrets(str(ge.data.get("message", ge))) if hasattr(ge, "data") else "Authentication error"
            logger.warning(f"GitHub connectivity test failed: {sanitized_err}")
            return {
                "status": "error",
                "authenticated": False,
                "error": f"GitHub API Error: {sanitized_err}",
                "repository": settings.GITHUB_REPOSITORY
            }
        except Exception as e:
            sanitized_err = redact_secrets(str(e))
            logger.warning(f"GitHub client error: {sanitized_err}")
            return {
                "status": "error",
                "authenticated": False,
                "error": f"Connection failed: {sanitized_err}",
                "repository": settings.GITHUB_REPOSITORY
            }

    def get_latest_commit_sha(self, branch: str = "main") -> Optional[str]:
        """Fetches the latest commit SHA for a branch."""
        try:
            gh = self._get_client()
            if not gh:
                return None
            repo = gh.get_repo(settings.GITHUB_REPOSITORY)
            commit = repo.get_branch(branch).commit
            return commit.sha
        except Exception as e:
            logger.warning(f"Failed to fetch commit SHA: {redact_secrets(str(e))}")
            return None

github_service = GitHubIntegrationService()
