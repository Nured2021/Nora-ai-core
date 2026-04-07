# NORA AI Builder

> Real AI Builder Workspace — a live AI software factory

## Overview

NORA AI Builder is a professional IDE-style AI build workspace inspired by tools like Replit and Cursor. It provides a real-time build pipeline where you can watch AI generate your project, inject instructions mid-build, stop/continue builds, and preview results — all in one dark, high-tech interface.

## Features

- **Live Build Pipeline**: Watch your build progress through stages: queued → thinking → planning → generating → fixing → validating → finalizing → complete
- **Real-time Logs**: Streaming system logs with timestamps and level indicators
- **File Tree**: See files appear as they are generated
- **AI Chat Panel**: Full conversation history with the AI builder + inject mid-build instructions
- **Preview Panel**: Live preview when build completes
- **Stop/Continue Controls**: Full human-in-the-loop control
- **SSE-ready Backend**: Structured for real AI orchestration

## Project Structure

```
.
├── frontend/          # React + TypeScript + Vite + Tailwind CSS
│   └── src/
│       ├── components/    # UI components
│       ├── hooks/         # useBuildSession hook
│       ├── api/           # buildApi client
│       └── types/         # TypeScript types
└── backend/           # Node.js + Express + TypeScript
    └── src/
        ├── routes/        # API routes
        ├── state/         # In-memory build session state
        └── types/         # Shared types
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Run the Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:3001`

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`

### Open the App

Navigate to [http://localhost:5173](http://localhost:5173)

1. Enter a build request in the top bar (e.g., "Build a task management app with React")
2. Click **Start Build** or press ⌘+Enter
3. Watch the pipeline progress in real time
4. Inject extra instructions using the chat panel
5. Stop or continue the build at any time

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/build/start` | Start a new build |
| POST | `/api/build/stop` | Stop current build |
| POST | `/api/build/continue` | Continue a stopped build |
| POST | `/api/build/instruction` | Inject an instruction |
| GET | `/api/build/status` | Get build status (supports SSE) |
| GET | `/api/build/logs` | Get build logs |
| GET | `/api/build/files` | Get generated files |

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **State**: In-memory (ready for real AI orchestration)
