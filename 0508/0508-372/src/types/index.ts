export interface JsonSchema {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null'
  title?: string
  description?: string
  required?: string[]
  properties?: Record<string, JsonSchema>
  items?: JsonSchema
  enum?: string[]
  pattern?: string
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  format?: string
  default?: unknown
  errorMessage?: {
    required?: string
    pattern?: string
    minLength?: string
    maxLength?: string
    minimum?: string
    maximum?: string
  }
  dependsOn?: string
  enumMapping?: Record<string, string[]>
}

export interface FormFieldProps {
  schema: JsonSchema
  name: string
  title: string
  required?: boolean
}
