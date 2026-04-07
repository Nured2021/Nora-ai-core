export type BuildStatus =
  | 'idle'
  | 'queued'
  | 'thinking'
  | 'planning'
  | 'generating'
  | 'fixing'
  | 'validating'
  | 'finalizing'
  | 'complete'
  | 'stopped'
  | 'error';

export interface BuildStage {
  name: BuildStatus;
  label: string;
  description: string;
  startedAt?: string;
  completedAt?: string;
}

export interface BuildLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  message: string;
  stage?: BuildStatus;
}

export interface BuildFile {
  id: string;
  path: string;
  language: string;
  status: 'new' | 'modified' | 'deleted';
  content?: string;
  addedAt: string;
}

export interface BuildInstruction {
  id: string;
  content: string;
  timestamp: string;
  appliedAt?: string;
}

export interface ApprovalRecord {
  id: string;
  stage: BuildStatus;
  decision: 'approved' | 'rejected';
  reason?: string;
  timestamp: string;
}

export interface BuildSession {
  id: string;
  prompt: string;
  status: BuildStatus;
  currentStage: BuildStatus;
  stages: BuildStage[];
  logs: BuildLog[];
  files: BuildFile[];
  instructions: BuildInstruction[];
  approvals: ApprovalRecord[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
