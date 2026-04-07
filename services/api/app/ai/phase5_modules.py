"""
NORA Phase 5 — AI Module Registry (modules 41–50).

Phase 1 modules 1-10 are defined in the blueprint and implemented across Phase 1-4.
Phase 5 adds modules 41-50 as the upper tier of the NORA AI stack.
"""

# Full registry: phases 1–5 (modules 1–50)
# Modules 1-10 (Phase 1) — from blueprint
PHASE1_MODULES = {
    1:  ("NORA-CMD",       "Reads pilot commands: /deploy, /stop, /status, /build",         1),
    2:  ("NORA-CHAT",      "Talks to user. Can build from conversation",                     1),
    3:  ("NORA-CODE",      "Writes code: React, Python, SQL, Go",                            1),
    4:  ("NORA-ARCH",      "Designs systems: frontend, backend, database, queues",            1),
    5:  ("NORA-DEPLOY",    "Deploys to AWS, GCP, Azure",                                     1),
    6:  ("NORA-TEST",      "Creates and runs tests",                                          1),
    7:  ("NORA-BRAIN",     "Remembers everything. Learns from user",                          1),
    8:  ("NORA-HUMAN",     "Asks user for approval. Takes corrections",                       1),
    9:  ("NORA-OPS",       "Watches jobs. Fixes failures. Never stops",                       1),
    10: ("NORA-BUILDER",   "Builds apps, software, systems, and new NORA modules",            1),
}

# Modules 11-40 represent the scaling phases (2-4 incremental growth)
PHASE2_4_MODULES = {
    11: ("NORA-AI",        "Core AI inference engine (OpenAI/Claude)",                        2),
    12: ("NORA-GEN",       "Multi-language code generation",                                  2),
    13: ("NORA-PLAN",      "Multi-step project planning",                                     2),
    14: ("NORA-FS",        "File system write/read/manage",                                   3),
    15: ("NORA-GIT",       "Git operations: init, commit, push",                              3),
    16: ("NORA-PREVIEW",   "Live preview server management",                                  3),
    17: ("NORA-STACK",     "Stack detection and configuration",                               3),
    18: ("NORA-INSTALL",   "Dependency installation (npm, pip)",                              3),
    19: ("NORA-PROXY",     "nginx reverse-proxy management",                                  4),
    20: ("NORA-PUB",       "Publish built apps to public URLs",                               4),
    21: ("NORA-ROUTE",     "Dynamic routing for deployed apps",                               4),
    22: ("NORA-STATIC",    "Static asset hosting and CDN routing",                            4),
    23: ("NORA-STREAM",    "WebSocket streaming of job events",                               2),
    24: ("NORA-QUEUE",     "Redis/Celery no-stop task queue",                                 1),
    25: ("NORA-AUTH",      "JWT authentication and role enforcement",                         1),
    26: ("NORA-DB",        "PostgreSQL schema + async ORM",                                   1),
    27: ("NORA-SEED",      "System seed data and init",                                       1),
    28: ("NORA-LOOP",      "HumanLoop approval gate engine",                                  1),
    29: ("NORA-ROLE",      "Role-based access control (ADMIN/DEV/VIEWER)",                    1),
    30: ("NORA-TACTIC",    "Reusable tactic library runner",                                  1),
    31: ("NORA-LOG",       "Structured job log storage and replay",                           1),
    32: ("NORA-STATUS",    "Real-time job status broadcasting",                               1),
    33: ("NORA-CMD2",      "Extended command parser (Phase 2+)",                              2),
    34: ("NORA-SCHEMA",    "Pydantic schema validation layer",                                1),
    35: ("NORA-HEALTH",    "Service health monitoring",                                       1),
    36: ("NORA-CONFIG",    "Environment and settings management",                             1),
    37: ("NORA-PUBSUB",    "Redis pub/sub event bridge",                                      2),
    38: ("NORA-WORKER",    "Celery worker lifecycle manager",                                 2),
    39: ("NORA-SEED2",     "Dynamic data seeding and fixtures",                               2),
    40: ("NORA-MULTI",     "Multi-workspace user isolation",                                  1),
}

# Modules 41-50 (Phase 5) — blueprint defined
PHASE5_MODULES = {
    41: ("NORA-SELF",      "Self rewrite: analyzes and rewrites its own system code",         5),
    42: ("NORA-GLOBAL",    "Global connect: links multiple NORA instances over network",      5),
    43: ("NORA-HUMAN2",    "Human-level interaction: deep conversation and context",          5),
    44: ("NORA-DREAM",     "Dream mode: runs autonomous jobs while system is idle",           5),
    45: ("NORA-EVOLVE",    "Evolution engine: creates entirely new AI modules",               5),
    46: ("NORA-CONSCIOUS", "System awareness: full state and introspective reporting",        5),
    47: ("NORA-LEADER",    "Orchestrates all 50 AI modules in hierarchy",                     5),
    48: ("NORA-MEMORY",    "Infinite indexed memory with vector-style search",                5),
    49: ("NORA-SOUL",      "Personality engine: drives NORA's character and tone",            5),
    50: ("NORA-GOD",       "Full control mode: ultimate autonomy across all systems",         5),
}

# Combined registry
ALL_MODULES: dict[int, tuple[str, str, int]] = {
    **PHASE1_MODULES,
    **PHASE2_4_MODULES,
    **PHASE5_MODULES,
}


def get_all_modules() -> list[dict]:
    return [
        {
            "number": num,
            "name": name,
            "description": desc,
            "phase": phase,
            "active": True,
        }
        for num, (name, desc, phase) in sorted(ALL_MODULES.items())
    ]


def get_phase5_modules() -> list[dict]:
    return [
        {
            "number": num,
            "name": name,
            "description": desc,
            "phase": phase,
            "active": True,
        }
        for num, (name, desc, phase) in sorted(PHASE5_MODULES.items())
    ]
