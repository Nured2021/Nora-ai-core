import { useBuildSession } from './hooks/useBuildSession';
import { BuilderTopBar } from './components/BuilderTopBar';
import { BuilderChatPanel } from './components/BuilderChatPanel';
import { PipelineBoard } from './components/PipelineBoard';
import { FileTreePanel } from './components/FileTreePanel';
import { SystemLogsPanel } from './components/SystemLogsPanel';
import { PreviewPanel } from './components/PreviewPanel';

export default function App() {
  const {
    session,
    logs,
    files,
    isLoading,
    startBuild,
    stopBuild,
    continueBuild,
    sendInstruction,
  } = useBuildSession();

  const status = session?.status ?? 'idle';

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-gray-200 overflow-hidden">
      <BuilderTopBar
        status={status}
        onStart={startBuild}
        onStop={stopBuild}
        onContinue={continueBuild}
        isLoading={isLoading}
        currentPrompt={session?.prompt}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 flex-shrink-0 flex flex-col border-r border-[#1e1e2e] overflow-hidden">
          <BuilderChatPanel
            session={session}
            onSendInstruction={sendInstruction}
          />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex border-b border-[#1e1e2e]" style={{ height: '45%' }}>
            <div className="w-56 flex-shrink-0 border-r border-[#1e1e2e] overflow-hidden">
              <PipelineBoard session={session} />
            </div>
            <div className="flex-1 overflow-hidden">
              <FileTreePanel files={files} />
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <SystemLogsPanel logs={logs} />
          </div>
        </div>

        <div className="w-80 flex-shrink-0 border-l border-[#1e1e2e] overflow-hidden">
          <PreviewPanel session={session} />
        </div>
      </div>
    </div>
  );
}
