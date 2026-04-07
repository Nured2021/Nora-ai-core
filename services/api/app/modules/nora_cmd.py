"""
NORA-CMD: Reads pilot commands: /deploy, /stop, /status, /build
Parses input and dispatches to appropriate handler.
"""
import re
from typing import Tuple, Optional


PILOT_COMMANDS = {"/build", "/status", "/stop", "/deploy", "/tactic", "/publish", "/help"}

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
    command is one of: /build /status /stop /deploy /tactic chat question
    """
    text = input_text.strip()

    # Pilot commands
    for cmd in PILOT_COMMANDS:
        if text.lower().startswith(cmd):
            rest = text[len(cmd):].strip()
            job_id = None
            # Extract job_id if present e.g. /stop JOB-123
            match = re.search(r"(JOB-\w+|\d+)", rest)
            if match:
                job_id = match.group(1)
            return cmd, rest, job_id

    # Natural language build detection
    for pattern in CHAT_BUILD_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return "/build", text, None

    # Status question — use linear regex (no .* backtracking on user input)
    lower_text = text.lower()
    if lower_text.startswith("status") or ("status" in lower_text and ("job" in lower_text or "#" in lower_text)):
        match = re.search(r"(JOB-\w+|#(\d+)|\b(\d+)\b)", text)
        job_id = match.group(1).lstrip("#") if match else None
        return "/status", text, job_id

    # Default: chat
    return "chat", text, None
