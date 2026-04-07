import { useState } from 'react';

interface InstructionInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export const InstructionInput: React.FC<InstructionInputProps> = ({ onSend, disabled }) => {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (value.trim()) {
      onSend(value.trim());
      setValue('');
    }
  };

  return (
    <div className="flex gap-2 p-3 border-t border-[#1e1e2e]">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
        placeholder="Inject instruction..."
        disabled={disabled}
        className="flex-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 font-mono focus:outline-none focus:border-indigo-600 transition-all disabled:opacity-40"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-semibold rounded transition-all"
      >
        Send
      </button>
    </div>
  );
};
