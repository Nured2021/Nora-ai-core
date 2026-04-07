
import type { BuildSession } from '../types/build';

interface PreviewPanelProps {
  session: BuildSession | null;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ session }) => {
  const isComplete = session?.status === 'complete';

  return (
    <div className="flex flex-col h-full bg-[#0f0f1a]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1e1e2e]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <div className="flex-1 mx-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded px-2 py-0.5 text-xs text-gray-600 font-mono">
          {isComplete ? 'http://localhost:5173/' : 'about:blank'}
        </div>
        <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Preview</span>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {!session && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-xl bg-[#1e1e2e] border border-[#2e2e3e] flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(99,102,241,0.1)]">
              <svg className="w-8 h-8 text-indigo-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-mono">No build running</p>
            <p className="text-gray-700 text-xs mt-1">Preview will appear here when build completes</p>
          </div>
        )}

        {session && !isComplete && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-2 border-indigo-900 border-t-indigo-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-indigo-950/50 flex items-center justify-center">
                  <span className="text-indigo-400 font-bold text-xs">N</span>
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-sm font-mono">Building...</p>
            <p className="text-gray-600 text-xs mt-1 font-mono capitalize">{session.currentStage}</p>
            <div className="mt-4 flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {isComplete && (
          <div className="absolute inset-0 bg-white">
            <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-gray-500 font-sans ml-2">NORA Generated App</span>
            </div>
            <div className="p-8 font-sans">
              <div className="max-w-lg mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">N</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">{session?.prompt?.slice(0, 40)}...</h1>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-indigo-50 border border-indigo-100 rounded" />
                  ))}
                </div>
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 font-sans">
                  ✓ Build complete — {session?.files?.length || 0} files generated
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 px-3 py-1.5 border-t border-[#1e1e2e] bg-[#0a0a0f]">
        <div className={`flex items-center gap-1.5 text-xs font-mono ${
          isComplete ? 'text-emerald-400' : session ? 'text-indigo-400' : 'text-gray-600'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isComplete ? 'bg-emerald-500' : session ? 'bg-indigo-500 animate-pulse' : 'bg-gray-700'
          }`} />
          {isComplete ? 'Ready' : session ? 'Building' : 'Idle'}
        </div>
        {session && (
          <span className="text-xs text-gray-600 font-mono ml-auto">
            {session.files?.length || 0} files
          </span>
        )}
      </div>
    </div>
  );
};
