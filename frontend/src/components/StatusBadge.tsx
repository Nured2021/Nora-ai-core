
import type { BuildStatus } from '../types/build';

interface StatusBadgeProps {
  status: BuildStatus;
  className?: string;
}

const STATUS_CONFIG: Record<BuildStatus, { label: string; color: string; glow: string; pulse: boolean }> = {
  idle: { label: 'IDLE', color: 'text-gray-400 bg-gray-900 border-gray-700', glow: '', pulse: false },
  queued: { label: 'QUEUED', color: 'text-yellow-400 bg-yellow-950 border-yellow-800', glow: 'shadow-[0_0_8px_rgba(234,179,8,0.3)]', pulse: true },
  thinking: { label: 'THINKING', color: 'text-blue-400 bg-blue-950 border-blue-800', glow: 'shadow-[0_0_8px_rgba(59,130,246,0.4)]', pulse: true },
  planning: { label: 'PLANNING', color: 'text-purple-400 bg-purple-950 border-purple-800', glow: 'shadow-[0_0_8px_rgba(168,85,247,0.4)]', pulse: true },
  generating: { label: 'GENERATING', color: 'text-indigo-400 bg-indigo-950 border-indigo-700', glow: 'shadow-[0_0_8px_rgba(99,102,241,0.4)]', pulse: true },
  fixing: { label: 'FIXING', color: 'text-orange-400 bg-orange-950 border-orange-800', glow: 'shadow-[0_0_8px_rgba(249,115,22,0.3)]', pulse: true },
  validating: { label: 'VALIDATING', color: 'text-cyan-400 bg-cyan-950 border-cyan-800', glow: 'shadow-[0_0_8px_rgba(6,182,212,0.3)]', pulse: true },
  finalizing: { label: 'FINALIZING', color: 'text-teal-400 bg-teal-950 border-teal-800', glow: 'shadow-[0_0_8px_rgba(20,184,166,0.3)]', pulse: true },
  complete: { label: 'COMPLETE', color: 'text-emerald-400 bg-emerald-950 border-emerald-700', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]', pulse: false },
  stopped: { label: 'STOPPED', color: 'text-gray-400 bg-gray-900 border-gray-600', glow: '', pulse: false },
  error: { label: 'ERROR', color: 'text-red-400 bg-red-950 border-red-800', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.4)]', pulse: false },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono font-semibold tracking-widest ${config.color} ${config.glow} ${className}`}
    >
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {config.label}
    </span>
  );
};
