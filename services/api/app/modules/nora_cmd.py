"""
NORA-CMD: Reads pilot commands: /deploy, /stop, /status, /build
Phase 5 adds: /self-upgrade, /global, /dream, /evolve, /consciousness, /personality, /memory, /god
Phase 6 adds: /workspace, /org, /team, /approve, /promote, /backup, /restore, /health, /analytics
Parses input and dispatches to appropriate handler.
"""
import re
from typing import Tuple, Optional


PILOT_COMMANDS = {
    "/build", "/status", "/stop", "/deploy", "/tactic", "/publish", "/help",
    # Phase 5
    "/self-upgrade", "/global", "/dream", "/evolve", "/consciousness",
    "/personality", "/memory", "/god",
    # Phase 6
    "/workspace", "/org", "/team", "/approve", "/promote",
    "/backup", "/restore", "/health", "/analytics",
}

CHAT_BUILD_PATTERNS = [
    r"\bbuild\b",
    r"\bcreate\b",
    r"\bmake\b",
    r"\bgenerate\b",
    r"\bwrite code\b",
]

# Phase 5 natural-language triggers
PHASE5_PATTERNS = {
    "/self-upgrade":  [r"\bself.?upgrade\b", r"\bupgrade (my)?self\b", r"\brewrite (my)?self\b"],
    "/consciousness": [r"\bconsciousness\b", r"\baware(ness)?\b", r"\bstatus (of )?nora\b"],
    "/god":           [r"\bgod mode\b"],
    "/dream":         [r"\bdream (mode|on|off)\b"],
    "/evolve":        [r"\bevolve\b", r"\bnew module\b"],
    "/global":        [r"\bglobal (connect|network|sync)\b"],
    "/memory":        [r"\bmemory (search|find|recall)\b"],
    "/personality":   [r"\bpersonality (set|change|update)\b"],
    # Phase 6 natural-language triggers
    "/workspace":     [r"\bworkspace (create|switch|new)\b"],
    "/org":           [r"\borg(anization)? (create|new)\b"],
    "/team":          [r"\bteam (invite|add)\b"],
    "/backup":        [r"\bbackup (run|start|now)\b"],
    "/restore":       [r"\brestore (latest|backup)\b"],
    "/health":        [r"\bhealth (full|check|status)\b"],
    "/analytics":     [r"\banalytics (dashboard|show|view)\b"],
    "/promote":       [r"\bpromote (staging|to production)\b"],
}


def parse_command(input_text: str) -> Tuple[str, str, Optional[str]]:
    """
    Returns (command, cleaned_input, job_id_if_any).
    command is one of the PILOT_COMMANDS or 'chat'.
    """
    text = input_text.strip()

    # Pilot commands (exact prefix match, longest first to avoid /god vs /global clash)
    for cmd in sorted(PILOT_COMMANDS, key=len, reverse=True):
        if text.lower().startswith(cmd):
            rest = text[len(cmd):].strip()
            job_id = None
            match = re.search(r"(JOB-\w+|\d+)", rest)
            if match:
                job_id = match.group(1)
            return cmd, rest, job_id

    # Phase 5 natural language triggers
    lower = text.lower()
    for cmd, patterns in PHASE5_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, lower):
                return cmd, text, None

    # Natural language build detection
    for pattern in CHAT_BUILD_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return "/build", text, None

    # Status question
    if lower.startswith("status") or ("status" in lower and ("job" in lower or "#" in lower)):
        match = re.search(r"(JOB-\w+|#(\d+)|\b(\d+)\b)", text)
        job_id = match.group(1).lstrip("#") if match else None
        return "/status", text, job_id

    return "chat", text, None
