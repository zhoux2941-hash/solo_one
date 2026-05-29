import { useState } from 'react'
import { templates, templateNames } from '../templates'

interface SchemaInputProps {
  value: string
  onChange: (value: string) => void
}

export const SchemaInput = ({ value, onChange }: SchemaInputProps) => {
  const [showTemplates, setShowTemplates] = useState(false)

  const handleTemplateSelect = (key: string) => {
    const template = templates[key]
    onChange(JSON.stringify(template, null, 2))
    setShowTemplates(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">JSON Schema</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            模板
          </button>
          {showTemplates && (
            <div className="absolute right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[120px]">
              {templateNames.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleTemplateSelect(item.key)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 w-full p-3 border border-gray-300 rounded-md resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder='{"type": "object", "properties": {...}}'
      />
    </div>
  )
}
