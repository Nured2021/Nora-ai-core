import { useState } from 'react';
import type { BuildStatus } from '../types/build';
import { StatusBadge } from './StatusBadge';

interface BuilderTopBarProps {
  status: BuildStatus;
  onStart: (prompt: string) => void;
  onStop: () => void;
  onContinue: () => void;
  isLoading: boolean;
  currentPrompt?: string;
}

export const BuilderTopBar: React.FC<BuilderTopBarProps> = ({
  status,
  onStart,
  onStop,
  onContinue,
  isLoading,
  currentPrompt,
}) => {
  const [prompt, setPrompt] = useState(currentPrompt || '');

  const isIdle = status === 'idle';
  const isStopped = status === 'stopped';
  const isRunning = !isIdle && !isStopped && status !== 'complete' && status !== 'error';

  const handleStart = () => {
    if (prompt.trim()) onStart(prompt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleStart();
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0f0f1a] border-b border-[#1e1e2e] h-14">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.5)]">
          <span className="text-white font-bold text-xs">N</span>
        </div>
        <span className="text-white font-semibold text-sm tracking-wide hidden sm:block">
          NORA <span className="text-indigo-400">AI Builder</span>
        </span>
      </div>

      <div className="w-px h-6 bg-[#1e1e2e] mx-1" />

      <div className="flex-1 relative">
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to build... (⌘+Enter to start)"
          disabled={isRunning || isLoading}
          className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-indigo-600 focus:shadow-[0_0_8px_rgba(99,102,241,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {(isIdle || status === 'complete' || status === 'error') && (
          <button
            onClick={handleStart}
            disabled={!prompt.trim() || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:opacity-50 text-white text-xs font-semibold rounded transition-all shadow-[0_0_8px_rgba(99,102,241,0.3)] hover:shadow-[0_0_12px_rgba(99,102,241,0.5)] disabled:shadow-none disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
            Start Build
          </button>
        )}

        {isRunning && (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900 hover:bg-red-800 text-red-300 text-xs font-semibold rounded transition-all border border-red-800"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            Stop
          </button>
        )}

        {isStopped && (
          <button
            onClick={onContinue}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-300 text-xs font-semibold rounded transition-all border border-emerald-800"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
            Continue
          </button>
        )}

        <div className="w-px h-6 bg-[#1e1e2e]" />
        <StatusBadge status={status} />
      </div>
    </div>
  );
};
