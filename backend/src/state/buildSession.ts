import { v4 as uuidv4 } from 'uuid';
import {
  BuildSession,
  BuildStatus,
  BuildLog,
  BuildFile,
  BuildStage,
  BuildInstruction,
} from '../types/build';

const STAGES: BuildStage[] = [
  { name: 'queued', label: 'Queued', description: 'Build queued for processing' },
  { name: 'thinking', label: 'Thinking', description: 'AI analyzing the prompt' },
  { name: 'planning', label: 'Planning', description: 'Creating architecture plan' },
  { name: 'generating', label: 'Generating', description: 'Generating source files' },
  { name: 'fixing', label: 'Fixing', description: 'Auto-fixing issues' },
  { name: 'validating', label: 'Validating', description: 'Validating output' },
  { name: 'finalizing', label: 'Finalizing', description: 'Finalizing the build' },
  { name: 'complete', label: 'Complete', description: 'Build complete' },
];

const MOCK_FILES: Array<Omit<BuildFile, 'id' | 'addedAt'>> = [
  { path: 'src/index.ts', language: 'typescript', status: 'new' },
  { path: 'src/App.tsx', language: 'typescript', status: 'new' },
  { path: 'src/components/Header.tsx', language: 'typescript', status: 'new' },
  { path: 'src/components/Layout.tsx', language: 'typescript', status: 'new' },
  { path: 'src/hooks/useData.ts', language: 'typescript', status: 'new' },
  { path: 'src/api/client.ts', language: 'typescript', status: 'new' },
  { path: 'src/styles/globals.css', language: 'css', status: 'new' },
  { path: 'package.json', language: 'json', status: 'new' },
  { path: 'vite.config.ts', language: 'typescript', status: 'new' },
  { path: 'tailwind.config.js', language: 'javascript', status: 'new' },
  { path: 'README.md', language: 'markdown', status: 'new' },
];

const MOCK_LOGS_BY_STAGE: Record<BuildStatus, string[]> = {
  idle: [],
  queued: [
    'Build request received',
    'Validating prompt...',
    'Prompt validated. Adding to queue.',
    'Session created: initializing workspace',
  ],
  thinking: [
    'Loading AI model context...',
    'Analyzing prompt requirements...',
    'Identifying core architecture patterns...',
    'Evaluating technology stack options...',
    'Selecting optimal approach for this build type',
  ],
  planning: [
    'Drafting component hierarchy...',
    'Defining API contracts...',
    'Mapping data flow...',
    'Planning folder structure...',
    'Architecture plan complete. Ready to generate.',
  ],
  generating: [
    'Scaffolding project structure...',
    'Writing src/index.ts...',
    'Writing src/App.tsx...',
    'Generating component: Header',
    'Generating component: Layout',
    'Writing hooks: useData',
    'Writing API client...',
    'Generating styles...',
    'Writing configuration files...',
    'Source generation complete.',
  ],
  fixing: [
    'Running static analysis...',
    'Found 2 TypeScript warnings...',
    'Auto-fixing: type coercion in useData.ts',
    'Auto-fixing: missing prop types in Header.tsx',
    'Re-checking after fixes...',
    'All issues resolved.',
  ],
  validating: [
    'Running build validation...',
    'Checking imports...',
    'Checking exports...',
    'Validating component contracts...',
    'Running type checks...',
    'All checks passed.',
  ],
  finalizing: [
    'Generating README.md...',
    'Writing package.json...',
    'Optimizing bundle configuration...',
    'Cleanup complete.',
    'Preparing output artifacts...',
  ],
  complete: [
    '✓ Build complete.',
    '✓ All files generated successfully.',
    '✓ Ready for preview.',
  ],
  stopped: ['Build stopped by user.'],
  error: ['Build encountered an error.'],
};

let currentSession: BuildSession | null = null;
let stageTimer: NodeJS.Timeout | null = null;
let logTimer: ReturnType<typeof setInterval> | null = null;

function createLog(
  message: string,
  level: BuildLog['level'] = 'info',
  stage?: BuildStatus
): BuildLog {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    level,
    message,
    stage,
  };
}

function addLog(message: string, level: BuildLog['level'] = 'info') {
  if (!currentSession) return;
  currentSession.logs.push(createLog(message, level, currentSession.currentStage));
  currentSession.updatedAt = new Date().toISOString();
  if (currentSession.logs.length > 500) {
    currentSession.logs = currentSession.logs.slice(-500);
  }
}

function advanceToNextStage() {
  if (!currentSession) return;
  if (currentSession.status === 'stopped' || currentSession.status === 'error') return;

  const stageOrder: BuildStatus[] = [
    'queued', 'thinking', 'planning', 'generating',
    'fixing', 'validating', 'finalizing', 'complete',
  ];

  const currentIndex = stageOrder.indexOf(currentSession.currentStage);
  if (currentIndex === -1 || currentIndex >= stageOrder.length - 1) return;

  const nextStage = stageOrder[currentIndex + 1];

  const currentStageObj = currentSession.stages.find(s => s.name === currentSession!.currentStage);
  if (currentStageObj) {
    currentStageObj.completedAt = new Date().toISOString();
  }

  currentSession.currentStage = nextStage;
  currentSession.status = nextStage;

  const nextStageObj = currentSession.stages.find(s => s.name === nextStage);
  if (nextStageObj) {
    nextStageObj.startedAt = new Date().toISOString();
  }

  currentSession.updatedAt = new Date().toISOString();

  addLog(`Stage: ${nextStage.toUpperCase()}`, 'info');

  if (nextStage === 'complete') {
    currentSession.completedAt = new Date().toISOString();
    // Also mark the complete stage itself as done
    const completeStageObj = currentSession.stages.find(s => s.name === 'complete');
    if (completeStageObj) {
      completeStageObj.completedAt = currentSession.completedAt;
    }
  }
}

function runStageLogs() {
  if (!currentSession) return;
  if (currentSession.status === 'stopped' || currentSession.status === 'error') return;

  const stageLogs = MOCK_LOGS_BY_STAGE[currentSession.currentStage] || [];
  let logIndex = 0;

  logTimer = setInterval(() => {
    if (!currentSession) {
      clearInterval(logTimer!);
      return;
    }
    if (currentSession.status === 'stopped' || currentSession.status === 'error') {
      clearInterval(logTimer!);
      return;
    }
    if (logIndex < stageLogs.length) {
      addLog(stageLogs[logIndex], logIndex === stageLogs.length - 1 ? 'success' : 'info');
      logIndex++;
    } else {
      clearInterval(logTimer!);
    }
  }, 600);
}

function addMockFiles(stage: BuildStatus) {
  if (!currentSession) return;

  const filesByStage: Record<string, typeof MOCK_FILES> = {
    planning: MOCK_FILES.slice(0, 2),
    generating: MOCK_FILES.slice(2, 8),
    fixing: MOCK_FILES.slice(8, 9).map(f => ({ ...f, status: 'modified' as const })),
    finalizing: MOCK_FILES.slice(9),
  };

  const files = filesByStage[stage] || [];
  files.forEach(f => {
    if (!currentSession) return;
    currentSession.files.push({
      ...f,
      id: uuidv4(),
      addedAt: new Date().toISOString(),
    });
  });
}

export function startBuild(prompt: string): BuildSession {
  if (stageTimer) clearTimeout(stageTimer);
  if (logTimer) clearInterval(logTimer);

  const stages = STAGES.map(s => ({ ...s }));
  stages[0].startedAt = new Date().toISOString();

  currentSession = {
    id: uuidv4(),
    prompt,
    status: 'queued',
    currentStage: 'queued',
    stages,
    logs: [createLog('Build started', 'info', 'queued'), createLog(`Prompt: "${prompt}"`, 'debug', 'queued')],
    files: [],
    instructions: [],
    approvals: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  simulatePipeline();
  return currentSession;
}

function simulatePipeline() {
  if (!currentSession) return;

  const stageDurations: Partial<Record<BuildStatus, number>> = {
    queued: 2000,
    thinking: 4000,
    planning: 5000,
    generating: 8000,
    fixing: 4000,
    validating: 3000,
    finalizing: 3000,
  };

  function runNextStage() {
    if (!currentSession) return;
    if (currentSession.status === 'stopped' || currentSession.status === 'error') return;
    if (currentSession.currentStage === 'complete') return;

    runStageLogs();
    addMockFiles(currentSession.currentStage);

    const duration = stageDurations[currentSession.currentStage] ?? 3000;

    stageTimer = setTimeout(() => {
      if (!currentSession) return;
      if (currentSession.status === 'stopped' || currentSession.status === 'error') return;
      advanceToNextStage();
      runNextStage();
    }, duration);
  }

  runNextStage();
}

export function stopBuild(): BuildSession | null {
  if (!currentSession) return null;
  if (stageTimer) clearTimeout(stageTimer);
  if (logTimer) clearInterval(logTimer);
  currentSession.status = 'stopped';
  currentSession.updatedAt = new Date().toISOString();
  addLog('Build stopped by user.', 'warn');
  return currentSession;
}

export function continueBuild(): BuildSession | null {
  if (!currentSession) return null;
  if (currentSession.status !== 'stopped') return currentSession;
  currentSession.status = currentSession.currentStage;
  currentSession.updatedAt = new Date().toISOString();
  addLog('Build resumed by user.', 'info');
  simulatePipeline();
  return currentSession;
}

export function addInstruction(content: string): BuildSession | null {
  if (!currentSession) return null;
  const instruction: BuildInstruction = {
    id: uuidv4(),
    content,
    timestamp: new Date().toISOString(),
  };
  currentSession.instructions.push(instruction);
  currentSession.updatedAt = new Date().toISOString();
  addLog(`User instruction: "${content}"`, 'info');
  return currentSession;
}

export function getSession(): BuildSession | null {
  return currentSession;
}
