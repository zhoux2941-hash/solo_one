import { useController, useWatch } from 'react-hook-form'
import { FormFieldProps } from '../types'
import { getErrorMessage } from '../utils'

export const SelectField = ({ schema, name, title, required }: FormFieldProps) => {
  const dependsOnValue = schema.dependsOn ? useWatch({ name: schema.dependsOn }) : null

  const { field, fieldState } = useController({
    name,
    rules: {
      required: required ? getErrorMessage(schema, 'required') : false,
    },
  })

  const currentOptions = schema.enumMapping && dependsOnValue
    ? schema.enumMapping[dependsOnValue as string] || []
    : schema.enum || []

  const hasDependsOn = schema.dependsOn && schema.enumMapping

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {title}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {schema.description && (
        <p className="text-xs text-gray-500 mb-1">{schema.description}</p>
      )}
      <select
        {...field}
        onChange={(e) => {
          field.onChange(e)
        }}
        disabled={hasDependsOn && !dependsOnValue ? true : false}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          fieldState.error ? 'border-red-500' : 'border-gray-300'
        } ${hasDependsOn && !dependsOnValue ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">请选择...</option>
        {currentOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {hasDependsOn && !dependsOnValue && (
        <p className="mt-1 text-xs text-gray-400">请先选择{schema.dependsOn}</p>
      )}
      {fieldState.error && (
        <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
      )}
    </div>
  )
}
