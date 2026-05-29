import { useController } from 'react-hook-form'
import { FormFieldProps } from '../types'
import { getErrorMessage } from '../utils'

export const NumberField = ({ schema, name, title, required }: FormFieldProps) => {
  const { field, fieldState } = useController({
    name,
    rules: {
      required: required ? getErrorMessage(schema, 'required') : false,
      min: schema.minimum ? { value: schema.minimum, message: getErrorMessage(schema, 'minimum') } : undefined,
      max: schema.maximum ? { value: schema.maximum, message: getErrorMessage(schema, 'maximum') } : undefined,
    },
  })

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {title}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {schema.description && (
        <p className="text-xs text-gray-500 mb-1">{schema.description}</p>
      )}
      <input
        type="number"
        {...field}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          fieldState.error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {fieldState.error && (
        <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
      )}
    </div>
  )
}
