import { useHuffmanStore } from '@/hooks/useHuffmanStore';
import { Type } from 'lucide-react';

export default function TextInput() {
  const inputText = useHuffmanStore(s => s.inputText);
  const setInputText = useHuffmanStore(s => s.setInputText);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const filtered = val.replace(/[^a-zA-Z ]/g, '');
    setInputText(filtered);
  };

  const charCount = inputText.length;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <Type size={18} className="text-amber-400" />
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">输入文本</h2>
      </div>
      <textarea
        value={inputText}
        onChange={handleChange}
        placeholder="输入英文大小写字母和空格..."
        className="w-full h-32 bg-[#0a1628] border border-zinc-700/50 rounded-xl p-4 text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all font-mono text-sm leading-relaxed"
      />
      <div className="flex justify-between items-center mt-2 px-1">
        <span className="text-xs text-zinc-500">仅支持 A-Z a-z 及空格</span>
        <span className="text-xs text-zinc-500 font-mono">{charCount} 字符</span>
      </div>
    </div>
  );
}
