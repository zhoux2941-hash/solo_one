import type { ConversionMode } from '../utils/brailleConverter';

interface ConversionPanelProps {
  mode: ConversionMode;
  onChange: (mode: ConversionMode) => void;
}

export function ConversionPanel({ mode, onChange }: ConversionPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">转换模式</h2>
      <div className="flex gap-4">
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            mode === 'pinyin'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => onChange('pinyin')}
        >
          拼音转盲文
        </button>
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            mode === 'glyph'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => onChange('glyph')}
        >
          字形转盲文
        </button>
      </div>
      <p className="mt-3 text-sm text-gray-500">
        {mode === 'pinyin' 
          ? '根据汉字拼音进行盲文转换，支持常用汉字'
          : '根据汉字字形进行盲文转换，支持一级字库约500个汉字'}
      </p>
    </div>
  );
}