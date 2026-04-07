import { useEffect, useRef } from 'react';
import type { BuildSession, BuildInstruction } from '../types/build';
import { InstructionInput } from './InstructionInput';
import { ApprovalControls } from './ApprovalControls';

interface BuilderChatPanelProps {
  session: BuildSession | null;
  onSendInstruction: (content: string) => void;
  onApprove?: () => void;
  onReject?: () => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const STAGE_MESSAGES: Record<string, string> = {
  queued: 'Build queued. Waiting to process...',
  thinking: 'Analyzing your requirements...',
  planning: 'Creating architecture and planning structure...',
  generating: 'Generating source files and components...',
  fixing: 'Auto-fixing issues found during generation...',
  validating: 'Validating all outputs and contracts...',
  finalizing: 'Finalizing the build artifacts...',
  complete: 'Build complete! All files are ready.',
  stopped: 'Build was stopped. You can continue at any time.',
  error: 'An error occurred during the build.',
};

export const BuilderChatPanel: React.FC<BuilderChatPanelProps> = ({
  session,
  onSendInstruction,
  onApprove,
  onReject,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isRunning = session && !['idle', 'complete', 'stopped', 'error'].includes(session.status);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.instructions, session?.status]);

  const showApproval = false;

  return (
    <div className="flex flex-col h-full bg-[#0f0f1a]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e1e2e]">
        <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">AI Builder Chat</span>
        <span className="text-xs text-indigo-500 font-mono">
          {session ? `Session ${session.id.slice(0, 8)}` : 'No session'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!session && (
          <div className="text-center text-gray-600 text-xs font-mono mt-8">
            <div className="w-8 h-8 rounded-full bg-[#1e1e2e] flex items-center justify-center mx-auto mb-3">
              <span className="text-indigo-400 font-bold text-sm">N</span>
            </div>
            <p>Start a build to begin</p>
          </div>
        )}

        {session && (
          <>
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded bg-indigo-900 border border-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-indigo-300 text-xs font-bold">U</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">{formatTime(session.createdAt)}</div>
                <div className="bg-[#1a1a2e] border border-[#2e2e4e] rounded p-2.5 text-sm text-gray-200 font-mono">
                  {session.prompt}
                </div>
              </div>
            </div>

            {session.stages
              .filter(s => s.startedAt)
              .map(stage => (
                <div key={stage.name} className="flex gap-2">
                  <div className="w-6 h-6 rounded bg-[#1e1e2e] border border-indigo-900 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-indigo-400 text-xs font-bold">N</span>
                  </div>
                  <div className="flex-1">
                    {stage.startedAt && (
                      <div className="text-xs text-gray-600 mb-1">{formatTime(stage.startedAt)}</div>
                    )}
                    <div className={`text-xs font-mono p-2 rounded border ${
                      stage.completedAt
                        ? 'text-gray-400 bg-[#0f0f1a] border-[#1e1e2e]'
                        : 'text-indigo-300 bg-indigo-950/30 border-indigo-900/50'
                    }`}>
                      {STAGE_MESSAGES[stage.name] || stage.description}
                      {stage.completedAt && <span className="text-emerald-500 ml-2">✓</span>}
                    </div>
                  </div>
                </div>
              ))}

            {session.instructions.map((instr: BuildInstruction) => (
              <div key={instr.id} className="flex gap-2">
                <div className="w-6 h-6 rounded bg-indigo-900 border border-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-indigo-300 text-xs font-bold">U</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">{formatTime(instr.timestamp)}</div>
                  <div className="bg-[#1a1a2e] border border-indigo-900/50 rounded p-2 text-xs text-indigo-200 font-mono">
                    <span className="text-indigo-500 mr-1">↳</span>{instr.content}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        <div ref={chatEndRef} />
      </div>

      {showApproval && session && session.currentStage && onApprove && onReject && (
        <ApprovalControls
          stage={session.currentStage}
          onApprove={onApprove}
          onReject={onReject}
          disabled={!isRunning}
        />
      )}

      <InstructionInput
        onSend={onSendInstruction}
        disabled={!session || session.status === 'complete' || session.status === 'error'}
      />
    </div>
  );
};
