import { JsonSchema } from '../types'
export { SchemaParser } from './SchemaParser'

export const validateSchema = (schema: string): { valid: boolean; error?: string; parsed?: JsonSchema } => {
  try {
    const parsed = JSON.parse(schema)
    return { valid: true, parsed }
  } catch (e) {
    return { valid: false, error: (e as Error).message }
  }
}

export const getErrorMessage = (
  schema: JsonSchema,
  errorType: 'required' | 'pattern' | 'minLength' | 'maxLength' | 'minimum' | 'maximum'
): string => {
  if (schema.errorMessage && schema.errorMessage[errorType]) {
    return schema.errorMessage[errorType]
  }
  const messages: Record<string, string> = {
    required: '此字段为必填项',
    pattern: '格式不正确',
    minLength: `最少需要${schema.minLength}个字符`,
    maxLength: `最多允许${schema.maxLength}个字符`,
    minimum: `最小值为${schema.minimum}`,
    maximum: `最大值为${schema.maximum}`,
  }
  return messages[errorType]
}

export const generateDefaultValue = (schema: JsonSchema): unknown => {
  if (schema.default !== undefined) return schema.default
  if (schema.type === 'string') return ''
  if (schema.type === 'number') return 0
  if (schema.type === 'boolean') return false
  if (schema.type === 'array') return []
  if (schema.type === 'object' && schema.properties) {
    const obj: Record<string, unknown> = {}
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      obj[key] = generateDefaultValue(propSchema)
    }
    return obj
  }
  return undefined
}
