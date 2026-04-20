"""
NORA-CHAT: Talks to user. Can build from conversation.
Generates human-readable responses about job status and build actions.
"""
from typing import Optional


HELP_TEXT = """NORA AI SYSTEM — PILOT COMMANDS

/build <description>   Build an app or system from natural language
/status [job_id]       Show status of jobs (all or specific job)
/stop <job_id>         Cancel a running job
/deploy <target>       Deploy (requires HumanLoop approval)
/tactic <name>         Run a saved tactic sequence, or list all tactics
/help                  Show this help

CHAT MODE:
  Just type naturally — "build a todo app", "create a REST API"
  NORA understands build requests without the /build prefix.

NO-STOP QUEUE:
  Jobs survive browser close and API restart.
  Multiple jobs run in parallel.
"""


def generate_response(context: str, input_text: str, job_id: Optional[str] = None) -> str:
    """Generate a natural language response for a given context."""
    if context == "build_started":
        return f"Starting build: {input_text}. I will design the architecture, write the code, and run tests."
    if context == "build_complete":
        return f"Build complete: {input_text}. All files generated and tests passed."
    if context == "deploy_queued":
        return f"Deploy request queued (Job {job_id}). Waiting for HumanLoop approval."
    if context == "tactic_running":
        return f"Running tactic '{input_text}'. Each step is queued as a separate build job."
    if context == "help":
        return HELP_TEXT
    return f"NORA: Understood. Processing: {input_text}"


def format_job_status(job: dict) -> str:
    """Format a job object into a readable status message."""
    status_icons = {
        "queued": "⏳",
        "running": "🔄",
        "completed": "✅",
        "failed": "❌",
        "cancelled": "🚫",
        "awaiting_approval": "⏸",
    }
    icon = status_icons.get(job.get("status", ""), "•")
    return f"{icon} [{job.get('job_id', '?')}] {job.get('command', '')} — {job.get('status', '?')}"
