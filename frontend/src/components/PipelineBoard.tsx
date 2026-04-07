
import type { BuildSession, BuildStage, BuildStatus } from '../types/build';

interface PipelineBoardProps {
  session: BuildSession | null;
}

const STAGE_ICONS: Record<BuildStatus, string> = {
  idle: '○',
  queued: '⏳',
  thinking: '🧠',
  planning: '📐',
  generating: '⚡',
  fixing: '🔧',
  validating: '✓',
  finalizing: '📦',
  complete: '✅',
  stopped: '⏸',
  error: '✗',
};

function StageItem({ stage, isCurrent }: { stage: BuildStage; isCurrent: boolean }) {
  const isDone = !!stage.completedAt;
  const isActive = !!stage.startedAt && !stage.completedAt;

  let borderColor = 'border-[#1e1e2e]';
  let textColor = 'text-gray-600';
  let bgColor = 'bg-[#0a0a0f]';
  let dot = 'bg-gray-700';

  if (isDone) {
    borderColor = 'border-emerald-900';
    textColor = 'text-emerald-400';
    bgColor = 'bg-emerald-950/20';
    dot = 'bg-emerald-500';
  } else if (isActive || isCurrent) {
    borderColor = 'border-indigo-700';
    textColor = 'text-indigo-300';
    bgColor = 'bg-indigo-950/30';
    dot = 'bg-indigo-500 animate-pulse';
  }

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded border ${borderColor} ${bgColor} transition-all`}>
      <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-semibold font-mono ${textColor}`}>
          {STAGE_ICONS[stage.name]} {stage.label}
        </div>
        <div className="text-xs text-gray-600 truncate">{stage.description}</div>
      </div>
      {isDone && <span className="text-emerald-500 text-xs shrink-0">✓</span>}
      {isActive && <span className="text-indigo-400 text-xs animate-pulse shrink-0">●</span>}
    </div>
  );
}

export const PipelineBoard: React.FC<PipelineBoardProps> = ({ session }) => {
  return (
    <div className="flex flex-col h-full bg-[#0f0f1a]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e1e2e]">
        <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Pipeline</span>
        {session && (
          <span className="text-xs text-gray-600 font-mono">
            {session.stages.filter(s => s.completedAt).length}/{session.stages.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {!session ? (
          <div className="space-y-2">
            {['Queued', 'Thinking', 'Planning', 'Generating', 'Fixing', 'Validating', 'Finalizing', 'Complete'].map(name => (
              <div key={name} className="flex items-center gap-3 p-2.5 rounded border border-[#1e1e2e] bg-[#0a0a0f]">
                <div className="w-2 h-2 rounded-full bg-gray-700 shrink-0" />
                <span className="text-xs text-gray-600 font-mono">{name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {session.stages.map(stage => (
              <StageItem
                key={stage.name}
                stage={stage}
                isCurrent={stage.name === session.currentStage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
