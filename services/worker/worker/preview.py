"""
NORA Phase 3 — Preview System

Detects the project stack, installs dependencies, and starts a preview server
as a background subprocess.  The preview URL (http://localhost:<port>) is
returned and stored in job.result.preview_url.

Port allocation uses a Redis counter cycling through PREVIEW_PORT_START …
PREVIEW_PORT_START + PREVIEW_PORT_COUNT - 1 (default 3001-3010).
"""
from __future__ import annotations

import os
import subprocess
import time

import redis

REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
WORKSPACE_ROOT: str = os.getenv("WORKSPACE_ROOT", "/workspace")

PREVIEW_PORT_START: int = 3001
PREVIEW_PORT_COUNT: int = 10


# ---------------------------------------------------------------------------
# Stack detection
# ---------------------------------------------------------------------------

def detect_stack(plan: dict) -> str:
    """Return 'react', 'fastapi', or 'unknown'."""
    stack_lower = [s.lower() for s in plan.get("stack", [])]
    react_kws = {"react", "vite", "next", "nextjs", "typescript", "tsx"}
    fastapi_kws = {"fastapi", "python", "flask", "django"}

    if react_kws & set(stack_lower):
        return "react"
    if fastapi_kws & set(stack_lower):
        return "fastapi"

    # Fall back to file-extension heuristic
    files = plan.get("files", [])
    tsx = sum(1 for f in files if f.endswith((".tsx", ".jsx", ".ts", ".js")))
    py = sum(1 for f in files if f.endswith(".py"))
    if tsx > py:
        return "react"
    if py > 0:
        return "fastapi"
    return "unknown"


# ---------------------------------------------------------------------------
# Dependency installation
# ---------------------------------------------------------------------------

def run_install(project_path: str, stack: str) -> tuple[bool, str]:
    """
    Install dependencies for the detected stack.
    Returns (success: bool, output: str).
    """
    try:
        if stack == "react":
            frontend_dir = _find_frontend_dir(project_path)
            pkg_json = os.path.join(frontend_dir, "package.json")

            # Generate a minimal package.json if none exists
            if not os.path.exists(pkg_json):
                _write_package_json(frontend_dir)

            ok, out = _run_cmd(
                ["npm", "install", "--prefer-offline", "--no-audit", "--no-fund"],
                frontend_dir,
                timeout=180,
            )
            if not ok:
                return False, f"npm install failed: {out[:400]}"

            ok2, out2 = _run_cmd(["npm", "run", "build"], frontend_dir, timeout=240)
            return ok2, out2[:400]

        if stack == "fastapi":
            backend_dir = _find_backend_dir(project_path)
            req_file = os.path.join(backend_dir, "requirements.txt")
            if not os.path.exists(req_file):
                with open(req_file, "w") as fh:
                    fh.write("fastapi\nuvicorn[standard]\n")
            ok, out = _run_cmd(
                ["pip", "install", "-r", "requirements.txt", "--quiet", "--no-warn-script-location"],
                backend_dir,
                timeout=180,
            )
            return ok, out[:400]

        return True, "No installation step for this stack."

    except Exception as exc:
        return False, str(exc)[:300]


# ---------------------------------------------------------------------------
# Preview server
# ---------------------------------------------------------------------------

def start_preview_server(project_path: str, stack: str, job_id: str) -> str | None:
    """
    Start a background preview server.
    Returns the preview URL, or None if a server could not be started.
    """
    try:
        port = _allocate_port()

        if stack == "react":
            build_dir = _find_build_dir(project_path)
            if build_dir is None:
                return None
            proc = subprocess.Popen(
                ["python3", "-m", "http.server", str(port), "--directory", build_dir],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            _save_pid(job_id, proc.pid, port)
            time.sleep(0.5)  # give the server a moment to bind
            return f"http://localhost:{port}"

        if stack == "fastapi":
            backend_dir = _find_backend_dir(project_path)
            module = _find_fastapi_module(backend_dir)
            proc = subprocess.Popen(
                ["uvicorn", module, "--host", "0.0.0.0", "--port", str(port)],
                cwd=backend_dir,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            _save_pid(job_id, proc.pid, port)
            time.sleep(1.5)
            return f"http://localhost:{port}"

        return None

    except Exception:
        return None


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _allocate_port() -> int:
    r = redis.from_url(REDIS_URL)
    idx = r.incr("nora:preview:port_counter")
    return PREVIEW_PORT_START + ((int(idx) - 1) % PREVIEW_PORT_COUNT)


def _save_pid(job_id: str, pid: int, port: int) -> None:
    r = redis.from_url(REDIS_URL)
    ttl = 3600
    r.setex(f"nora:preview:{job_id}:pid", ttl, pid)
    r.setex(f"nora:preview:{job_id}:port", ttl, port)


def _run_cmd(cmd: list[str], cwd: str, timeout: int = 120) -> tuple[bool, str]:
    try:
        result = subprocess.run(
            cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout
        )
        output = (result.stdout + result.stderr)
        return result.returncode == 0, output
    except subprocess.TimeoutExpired:
        return False, f"Timed out after {timeout}s"
    except FileNotFoundError as exc:
        return False, f"Command not found: {exc}"


def _find_frontend_dir(project_path: str) -> str:
    for candidate in ("frontend", "app", "web", "client", "ui"):
        d = os.path.join(project_path, candidate)
        if os.path.isdir(d):
            return d
    return project_path


def _find_backend_dir(project_path: str) -> str:
    for candidate in ("backend", "app", "api", "server"):
        d = os.path.join(project_path, candidate)
        if os.path.isdir(d):
            return d
    return project_path


def _find_build_dir(project_path: str) -> str | None:
    frontend_dir = _find_frontend_dir(project_path)
    for candidate in ("build", "dist", "out", ".next/static"):
        d = os.path.join(frontend_dir, candidate)
        if os.path.isdir(d):
            return d
    return None


def _find_fastapi_module(backend_dir: str) -> str:
    # Common patterns: app/main.py → "app.main:app", main.py → "main:app"
    if os.path.exists(os.path.join(backend_dir, "app", "main.py")):
        return "app.main:app"
    return "main:app"


def _write_package_json(frontend_dir: str) -> None:
    import json
    pkg = {
        "name": "nora-generated-app",
        "version": "0.1.0",
        "private": True,
        "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-scripts": "5.0.1",
        },
        "scripts": {
            "start": "react-scripts start",
            "build": "react-scripts build",
        },
        "browserslist": {
            "production": [">0.2%", "not dead", "not op_mini all"],
            "development": ["last 1 chrome version"],
        },
    }
    with open(os.path.join(frontend_dir, "package.json"), "w") as fh:
        json.dump(pkg, fh, indent=2)
