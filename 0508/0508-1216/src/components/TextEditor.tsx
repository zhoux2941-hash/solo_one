import { useRef, useCallback } from 'react';
import { Upload } from 'lucide-react';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  title: string;
  placeholder: string;
  onFileUpload: (file: File) => void;
}

export function TextEditor({ value, onChange, title, placeholder, onFileUpload }: TextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/plain') {
      onFileUpload(file);
    } else {
      alert('请上传 .txt 文件');
    }
    e.target.value = '';
  }, [onFileUpload]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button
          onClick={handleFileClick}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Upload size={16} />
          导入文件
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 w-full p-4 text-sm font-mono border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        spellCheck={false}
      />
    </div>
  );
}
