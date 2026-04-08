"""
NORA-CMD: Reads pilot commands: /deploy, /stop, /status, /build
Parses input and dispatches to appropriate handler.
"""
import re
from typing import Tuple, Optional


PILOT_COMMANDS = {
    "/build", "/status", "/stop", "/deploy", "/tactic", "/help",
}

CHAT_BUILD_PATTERNS = [
    r"\bbuild\b",
    r"\bcreate\b",
    r"\bmake\b",
    r"\bgenerate\b",
    r"\bwrite code\b",
]


def parse_command(input_text: str) -> Tuple[str, str, Optional[str]]:
    """
    Returns (command, cleaned_input, job_id_if_any).
    command is one of the PILOT_COMMANDS or 'chat'.
    """
    text = input_text.strip()

    # Pilot commands (exact prefix match, longest first)
    for cmd in sorted(PILOT_COMMANDS, key=len, reverse=True):
        if text.lower().startswith(cmd):
            rest = text[len(cmd):].strip()
            job_id = None
            match = re.search(r"(JOB-\w+|\d+)", rest)
            if match:
                job_id = match.group(1)
            return cmd, rest, job_id

    # Natural language build detection
    for pattern in CHAT_BUILD_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return "/build", text, None

    # Status question
    lower = text.lower()
    if lower.startswith("status") or ("status" in lower and ("job" in lower or "#" in lower)):
        match = re.search(r"(JOB-\w+|#(\d+)|\b(\d+)\b)", text)
        job_id = match.group(1).lstrip("#") if match else None
        return "/status", text, job_id

    return "chat", text, None
