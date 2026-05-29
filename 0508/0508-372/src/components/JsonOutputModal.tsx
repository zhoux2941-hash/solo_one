interface JsonOutputModalProps {
  data: unknown
  isOpen: boolean
  onClose: () => void
}

export const JsonOutputModal = ({ data, isOpen, onClose }: JsonOutputModalProps) => {
  if (!isOpen) return null

  const jsonString = JSON.stringify(data, null, 2)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString)
      alert('已复制到剪贴板')
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">表单数据输出</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[60vh] text-sm font-mono">
            {jsonString}
          </pre>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={handleCopy}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            复制
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
