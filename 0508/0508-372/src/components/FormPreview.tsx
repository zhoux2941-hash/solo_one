import { useForm, FormProvider } from 'react-hook-form'
import { JsonSchema } from '../types'
import { FormField } from './FormField'
import { generateDefaultValue } from '../utils'

interface FormPreviewProps {
  schema: JsonSchema | null
  onSubmit: (data: unknown) => void
}

export const FormPreview = ({ schema, onSubmit }: FormPreviewProps) => {
  const methods = useForm({
    defaultValues: schema ? (generateDefaultValue(schema) as { [x: string]: unknown }) : {},
  })

  const handleSubmit = (data: unknown) => {
    onSubmit(data)
  }

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        请输入有效的JSON Schema
      </div>
    )
  }

  const properties = schema.properties || {}

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmit)} className="h-full overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {schema.title || '表单预览'}
        </h2>
        {schema.description && (
          <p className="text-sm text-gray-500 mb-4">{schema.description}</p>
        )}
        {Object.entries(properties).map(([key, propSchema]) => (
          <FormField
            key={key}
            schema={propSchema}
            name={key}
            title={propSchema.title || key}
            required={schema.required?.includes(key)}
          />
        ))}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          提交
        </button>
      </form>
    </FormProvider>
  )
}
