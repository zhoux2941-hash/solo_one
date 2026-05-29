interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
}

export function InputArea({ value, onChange }: InputAreaProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">输入文本</h2>
      <textarea
        className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
        placeholder="请输入简体中文文本..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}