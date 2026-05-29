interface BrailleDisplayProps {
  text: string;
}

export function BrailleDisplay({ text }: BrailleDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">盲文结果</h2>
      <div className="min-h-[120px] p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-3xl font-bold text-gray-800 whitespace-pre-wrap break-all" style={{ fontFamily: '"Noto Sans Braille", sans-serif', letterSpacing: '0.3em' }}>
          {text || '转换结果将显示在这里...'}
        </p>
      </div>
    </div>
  );
}