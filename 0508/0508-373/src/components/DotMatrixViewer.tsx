interface DotMatrixViewerProps {
  dotMatrixData: number[][][];
  originalText: string;
}

export function DotMatrixViewer({ dotMatrixData, originalText }: DotMatrixViewerProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">点阵可视化</h2>
      <div className="min-h-[150px] p-4 bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto">
        {dotMatrixData.length === 0 ? (
          <p className="text-gray-400 text-center py-8">输入文本后将显示点阵图形...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {dotMatrixData.map((matrix, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <div className="grid grid-cols-2 gap-1 p-2 bg-gray-200 rounded">
                  {matrix.map((row, rowIndex) =>
                    row.map((dot, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`w-4 h-4 rounded-full ${
                          dot ? 'bg-gray-800' : 'bg-gray-300'
                        }`}
                      />
                    ))
                  )}
                </div>
                <span className="text-xs text-gray-600">
                  {originalText[index] || ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}