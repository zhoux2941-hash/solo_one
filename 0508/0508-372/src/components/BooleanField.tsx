import { useController } from 'react-hook-form'
import { FormFieldProps } from '../types'

export const BooleanField = ({ schema, name, title, required }: FormFieldProps) => {
  const { field } = useController({
    name,
    rules: {
      required: required ? '此字段为必填项' : false,
    },
  })

  return (
    <div className="mb-4 flex items-center">
      <input
        type="checkbox"
        {...field}
        checked={field.value}
        onChange={(e) => field.onChange(e.target.checked)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <label className="ml-2 block text-sm font-medium text-gray-700">
        {title}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {schema.description && (
        <p className="text-xs text-gray-500 ml-6">{schema.description}</p>
      )}
    </div>
  )
}
