import { useState, useEffect } from 'react'
import { SchemaInput } from './components/SchemaInput'
import { FormPreview } from './components/FormPreview'
import { JsonOutputModal } from './components/JsonOutputModal'
import { validateSchema } from './utils'
import { JsonSchema } from './types'
import { templates } from './templates'

function App() {
  const [schemaInput, setSchemaInput] = useState(
    JSON.stringify(templates.userRegistration, null, 2)
  )
  const [schema, setSchema] = useState<JsonSchema | null>(templates.userRegistration)
  const [validationError, setValidationError] = useState<string>('')
  const [showOutputModal, setShowOutputModal] = useState(false)
  const [outputData, setOutputData] = useState<unknown>(null)

  useEffect(() => {
    const result = validateSchema(schemaInput)
    if (result.valid) {
      setSchema(result.parsed as JsonSchema)
      setValidationError('')
    } else {
      setSchema(null)
      setValidationError(result.error || '无效的JSON')
    }
  }, [schemaInput])

  const handleSubmit = (data: unknown) => {
    setOutputData(data)
    setShowOutputModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">JSON Schema表单生成器</h1>
          <p className="text-sm text-gray-500 mt-1">输入JSON Schema，自动生成表单，输出JSON数据</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-160px)]">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <SchemaInput value={schemaInput} onChange={setSchemaInput} />
            {validationError && (
              <p className="mt-2 text-xs text-red-500">{validationError}</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">表单预览</span>
              <span className="text-xs text-gray-400">双栏模式</span>
            </div>
            <div className="h-[calc(100%-36px)] overflow-y-auto">
              <FormPreview schema={schema} onSubmit={handleSubmit} />
            </div>
          </div>
        </div>
      </main>

      <JsonOutputModal
        data={outputData}
        isOpen={showOutputModal}
        onClose={() => setShowOutputModal(false)}
      />
    </div>
  )
}

export default App
