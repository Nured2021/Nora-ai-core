
import type { BuildStatus } from '../types/build';

interface ApprovalControlsProps {
  stage: BuildStatus;
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
}

export const ApprovalControls: React.FC<ApprovalControlsProps> = ({
  stage,
  onApprove,
  onReject,
  disabled,
}) => {
  return (
    <div className="flex items-center gap-2 p-3 border-t border-[#1e1e2e] bg-[#0a0a0f]">
      <span className="text-xs text-gray-500 font-mono mr-auto">Approve stage: <span className="text-indigo-400">{stage}</span></span>
      <button
        onClick={onReject}
        disabled={disabled}
        className="px-3 py-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-400 text-xs font-semibold rounded transition-all disabled:opacity-40"
      >
        Reject
      </button>
      <button
        onClick={onApprove}
        disabled={disabled}
        className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 text-xs font-semibold rounded transition-all disabled:opacity-40"
      >
        Approve
      </button>
    </div>
  );
};
