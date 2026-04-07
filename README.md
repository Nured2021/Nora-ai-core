# NORA AI — Phase 1 Core System

> NORA = 50 AI + 50 Brain Connect + Orchestrator + HumanLoop + System Builder.  
> User gives commands like a pilot. NORA shows results live. NORA never stops jobs.

[![Phase 1](https://img.shields.io/badge/Phase-1%20Complete-6366f1)](#)
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20FastAPI%20%7C%20Celery%20%7C%20Postgres-0ea5e9)](#)

---

## 🚀 Quick Start (One Command)

```bash
docker compose up --build
```

Then open: **http://localhost:3000**

---

## 🔑 Default Credentials

| Username    | Password          | Role        |
|-------------|-------------------|-------------|
| `admin`     | `nora-admin-2024` | **ADMIN**   |
| `developer` | `nora-dev-2024`   | **DEVELOPER** |
| `viewer`    | `nora-view-2024`  | **VIEWER**  |

---

## 📐 Monorepo Structure

```
Nora-ai-core/
├── apps/
│   └── dashboard/          # Next.js 14 (React) — Sidebar UI, Live Jobs, HumanLoop
├── services/
│   ├── api/                # FastAPI — REST + WebSocket API
│   └── worker/             # Celery Worker — No-Stop job queue
├── packages/
│   └── shared/             # Shared types (future)
├── docs/
│   └── AI SYSTEM BLUEPRINT – PHASE 1 COMPLETE.txt
├── docker-compose.yml
└── README.md
```

---

## 🧱 Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js 14 (React + TypeScript)   |
| Backend    | FastAPI (Python 3.12)             |
| Queue      | Redis + Celery (no-stop jobs)     |
| Database   | PostgreSQL 16                     |
| Streaming  | WebSocket (native FastAPI + Redis pub/sub) |
| Auth       | JWT Bearer tokens                 |

---

## 🎯 Phase 1 Features

### 1. Pilot Mode Commands
```
/build <description>    — Build a project (queued, runs forever)
/status [job_id]        — Check job status
/stop <job_id>          — Cancel a running job
/deploy <target>        — Deploy (requires HumanLoop approval)
/tactic <name>          — Run a saved tactic sequence

# Or just type naturally:
build me a CRM with chat
create a REST API
```

### 2. No-Stop Queue
- Jobs are dispatched to Celery workers via Redis
- Jobs **continue running** even if the browser closes
- Only stopped by explicit `/stop <job_id>` or fatal error
- Worker restarts automatically with Docker

### 3. Live Job Streaming (WebSocket)
- Every job step is broadcast in real-time
- Dashboard subscribes to `/ws/feed` (global) or `/ws/jobs/{job_id}` (per-job)
- Logs stored in PostgreSQL for replay

### 4. Sidebar Dashboard UI
| Section       | Description                                         |
|---------------|-----------------------------------------------------|
| Dashboard     | Command input + live results + recent jobs          |
| Live Jobs     | All jobs with log viewer                            |
| Builder       | NORA-BUILDER interface with example prompts         |
| Brain Connect | 10 memory layers + stored memories                  |
| HumanLoop     | Pending approval gates (approve/reject/modify)      |
| Multi-User    | User management with role assignment (ADMIN only)   |
| Tactics       | Save and run reusable command sequences             |
| Settings      | Profile, role permissions, system info              |

### 5. HumanLoop Approval System
- `/deploy` commands are gated — require ADMIN or DEVELOPER to approve
- Approval UI shows: action, details, YES/NO/MODIFY buttons + optional note
- Once approved, job is dispatched to the worker queue
- Once rejected, job is cancelled

### 6. Multi-User Role Base
| Role        | Permissions                                          |
|-------------|------------------------------------------------------|
| ADMIN       | Full access, manage users, approve deployments       |
| DEVELOPER   | Build/deploy with approval, view all jobs            |
| VIEWER      | Read-only, view own jobs and logs                    |

### 7. 10 NORA AI Modules
1. **NORA-CMD** — Pilot command parser
2. **NORA-CHAT** — Conversation + natural language build
3. **NORA-CODE** — Code generation (React, Python, SQL)
4. **NORA-ARCH** — System architecture design
5. **NORA-DEPLOY** — Cloud deployment (AWS/GCP/Azure)
6. **NORA-TEST** — Test generation and running
7. **NORA-BRAIN** — Memory (10 Brain Connect layers)
8. **NORA-HUMAN** — HumanLoop approval gate
9. **NORA-OPS** — Job monitoring, no-stop orchestration
10. **NORA-BUILDER** — App/system builder

### 8. 10 Brain Connect Layers
1. Command History Memory
2. Code Pattern Recognition
3. User Preference Learning
4. System State Tracking
5. HumanLoop Feedback Storage
6. Deployment Target Memory
7. Error Recovery Tactics
8. Multi-User Role Mapping
9. Builder Template Library
10. Real-Time Feedback Loop

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | `/api/auth/token`     | Login (get JWT)      |
| GET    | `/api/auth/me`        | Current user info    |
| POST   | `/api/auth/register`  | Register new user    |

### Commands
| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| POST   | `/api/commands/` | Dispatch pilot command   |

### Jobs
| Method | Endpoint                    | Description            |
|--------|-----------------------------|------------------------|
| GET    | `/api/jobs/`                | List all jobs          |
| GET    | `/api/jobs/{job_id}`        | Get job detail         |
| GET    | `/api/jobs/{job_id}/logs`   | Get job logs           |

### HumanLoop
| Method | Endpoint                              | Description             |
|--------|---------------------------------------|-------------------------|
| GET    | `/api/humanloop/pending`              | Pending approvals       |
| POST   | `/api/humanloop/`                     | Create approval request |
| POST   | `/api/humanloop/{request_id}/decide`  | Approve/reject/modify   |

### Brain & Tactics
| Method | Endpoint                          | Description          |
|--------|-----------------------------------|----------------------|
| GET    | `/api/brain/layers`               | Brain layer info     |
| GET    | `/api/brain/memories`             | Stored memories      |
| GET    | `/api/brain/tactics`              | List tactics         |
| POST   | `/api/brain/tactics`              | Create tactic        |
| POST   | `/api/brain/tactics/{id}/run`     | Run tactic           |

### WebSocket
| Endpoint               | Description                           |
|------------------------|---------------------------------------|
| `ws://host/ws/feed`    | Global job feed (all events)          |
| `ws://host/ws/jobs/{job_id}` | Per-job live log stream         |

---

## 🏗 Local Development (without Docker)

### Backend API
```bash
cd services/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Celery Worker
```bash
cd services/worker
pip install -r requirements.txt
celery -A worker.celery_app worker --loglevel=info --queues=default
```

### Frontend Dashboard
```bash
cd apps/dashboard
npm install
npm run dev
# Open http://localhost:3000
```

---

## 📄 Blueprint

The full NORA AI System Blueprint is saved verbatim in:
```
docs/AI SYSTEM BLUEPRINT – PHASE 1 COMPLETE.txt
```

---

## 🔮 Phase 2+ Roadmap

- Real AI code generation (GPT-4/Claude integration)
- Real AWS/GCP deployment via NORA-DEPLOY
- Brain Connect layers 11-50
- Multi-workspace isolation
- NORA God Mode
- Advanced tactics with conditionals

