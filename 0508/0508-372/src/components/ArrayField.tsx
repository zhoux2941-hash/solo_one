import { useFieldArray, useFormContext, FieldValues } from 'react-hook-form'
import { JsonSchema } from '../types'
import { FormField } from './FormField'
import { generateDefaultValue } from '../utils'
import { generateUUID } from '../utils/uuid'

interface ArrayItem {
  id: string
  value: unknown
}

interface ArrayFieldProps {
  schema: JsonSchema
  name: string
  title: string
  required?: boolean
}

export const ArrayField = ({ schema, name, title, required }: ArrayFieldProps) => {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  })

  const itemSchema = schema.items || {}

  const handleAppend = () => {
    const defaultValue = generateDefaultValue(itemSchema)
    const newItem: ArrayItem = {
      id: generateUUID(),
      value: defaultValue,
    }
    append(newItem as FieldValues)
  }

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
        {fields.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无数据</p>
        ) : (
          fields.map((field, index) => (
            <div
              key={field.id || index}
              className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">
                  第 {index + 1} 项
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  删除
                </button>
              </div>
              <FormField
                schema={itemSchema}
                name={`${name}.${index}.value`}
                title=""
                required={false}
              />
            </div>
          ))
        )}
        <button
          type="button"
          onClick={handleAppend}
          className="mt-2 w-full py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          + 添加项
        </button>
      </div>
    </div>
  )
}
