
import type { BuildFile } from '../types/build';

interface FileTreePanelProps {
  files: BuildFile[];
}

const LANGUAGE_ICONS: Record<string, string> = {
  typescript: '🔷',
  javascript: '🟨',
  css: '🎨',
  json: '📋',
  markdown: '📝',
  html: '🌐',
  default: '📄',
};

function getIcon(language: string): string {
  return LANGUAGE_ICONS[language] || LANGUAGE_ICONS.default;
}

function getStatusStyle(status: BuildFile['status']): string {
  switch (status) {
    case 'new': return 'text-emerald-400';
    case 'modified': return 'text-yellow-400';
    case 'deleted': return 'text-red-400 line-through';
    default: return 'text-gray-400';
  }
}

function getStatusBadge(status: BuildFile['status']): string {
  switch (status) {
    case 'new': return 'N';
    case 'modified': return 'M';
    case 'deleted': return 'D';
    default: return '';
  }
}

export const FileTreePanel: React.FC<FileTreePanelProps> = ({ files }) => {
  return (
    <div className="flex flex-col h-full bg-[#0f0f1a]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e1e2e]">
        <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Generated Files</span>
        <span className="text-xs text-gray-600 font-mono">{files.length} files</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {files.length === 0 ? (
          <div className="text-center text-gray-600 text-xs font-mono mt-6">
            <p>No files generated yet</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1e1e2e] transition-colors group"
              >
                <span className="text-xs">{getIcon(file.language)}</span>
                <span className={`flex-1 text-xs font-mono truncate ${getStatusStyle(file.status)}`}>
                  {file.path}
                </span>
                <span className={`text-xs font-bold shrink-0 opacity-60 group-hover:opacity-100 ${
                  file.status === 'new' ? 'text-emerald-500' :
                  file.status === 'modified' ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {getStatusBadge(file.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
