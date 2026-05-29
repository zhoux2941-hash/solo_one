import { JsonSchema } from '../types'
import { FormField } from './FormField'

interface ObjectFieldProps {
  schema: JsonSchema
  name: string
  title: string
  required?: boolean
}

export const ObjectField = ({ schema, name, title, required }: ObjectFieldProps) => {
  const properties = schema.properties || {}

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {title}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {schema.description && (
        <p className="text-xs text-gray-500 mb-1">{schema.description}</p>
      )}
      <div className="border border-gray-300 rounded-md p-4">
        {Object.entries(properties).map(([key, propSchema]) => (
          <FormField
            key={key}
            schema={propSchema}
            name={`${name}.${key}`}
            title={propSchema.title || key}
            required={schema.required?.includes(key)}
          />
        ))}
      </div>
    </div>
  )
}
