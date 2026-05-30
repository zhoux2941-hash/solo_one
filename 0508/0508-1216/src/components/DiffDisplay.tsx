import type { Diff, LineDiff, CompareMode } from '../types';

interface DiffDisplayProps {
  diffs: Diff[] | LineDiff[];
  mode: CompareMode;
}

function getDiffStyle(type: Diff['type']) {
  switch (type) {
    case 'insert':
      return 'bg-green-100 text-green-800';
    case 'delete':
      return 'bg-red-100 text-red-800';
    case 'modify':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-transparent text-gray-800';
  }
}

export function DiffDisplay({ diffs, mode }: DiffDisplayProps) {
  if (mode === 'char') {
    const charDiffs = diffs as Diff[];
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">差异结果</h3>
        <div className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl overflow-auto">
          <pre className="text-sm font-mono whitespace-pre-wrap break-all">
            {charDiffs.map((diff, index) => (
              <span key={index} className={`${getDiffStyle(diff.type)} px-1 rounded`}>
                {diff.text}
              </span>
            ))}
          </pre>
        </div>
      </div>
    );
  }

  const lineDiffs = diffs as LineDiff[];
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">差异结果 (行级)</h3>
      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl overflow-auto">
        <div className="divide-y divide-gray-200">
          {lineDiffs.map((line) => (
            <div
              key={line.lineNumber}
              className={`flex ${line.isModified ? 'bg-gray-100' : 'bg-transparent'} hover:bg-gray-200/50`}
            >
              <span className="w-12 px-3 py-2 text-xs font-mono text-gray-500 border-r border-gray-200 flex-shrink-0">
                {line.lineNumber}
              </span>
              <div className="flex-1 px-3 py-2 text-sm font-mono">
                {line.charDiffs.map((diff, index) => (
                  <span key={index} className={`${getDiffStyle(diff.type)} px-1 rounded`}>
                    {diff.text || '\u00A0'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
