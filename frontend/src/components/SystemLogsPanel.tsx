import { useEffect, useRef } from 'react';
import type { BuildLog } from '../types/build';

interface SystemLogsPanelProps {
  logs: BuildLog[];
  autoScroll?: boolean;
}

const LEVEL_STYLES: Record<BuildLog['level'], string> = {
  info: 'text-gray-300',
  warn: 'text-yellow-400',
  error: 'text-red-400',
  success: 'text-emerald-400',
  debug: 'text-gray-500',
};

const LEVEL_PREFIX: Record<BuildLog['level'], string> = {
  info: 'INFO ',
  warn: 'WARN ',
  error: 'ERR  ',
  success: ' OK  ',
  debug: 'DBG  ',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

export const SystemLogsPanel: React.FC<SystemLogsPanelProps> = ({ logs, autoScroll = true }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e1e2e]">
        <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">System Logs</span>
        <span className="text-xs text-gray-600 font-mono">{logs.length} entries</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 font-mono">
        {logs.length === 0 ? (
          <div className="text-center text-gray-700 text-xs mt-6">No logs yet</div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="flex gap-2 py-0.5 text-xs hover:bg-[#1e1e2e]/30 px-1 rounded group">
              <span className="text-gray-700 shrink-0 group-hover:text-gray-600 select-none">
                {formatTime(log.timestamp)}
              </span>
              <span className={`shrink-0 ${LEVEL_STYLES[log.level]}`}>
                {LEVEL_PREFIX[log.level]}
              </span>
              <span className={`${LEVEL_STYLES[log.level]} break-all`}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};
