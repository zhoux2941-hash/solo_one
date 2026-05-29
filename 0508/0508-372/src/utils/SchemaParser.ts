import { JsonSchema } from '../types'

export class SchemaParser {
  private schema: JsonSchema

  constructor(schema: JsonSchema) {
    this.schema = schema
  }

  static fromJson(jsonString: string): SchemaParser {
    const schema = JSON.parse(jsonString) as JsonSchema
    return new SchemaParser(schema)
  }

  getType(): string | undefined {
    return this.schema.type
  }

  getTitle(): string | undefined {
    return this.schema.title
  }

  getDescription(): string | undefined {
    return this.schema.description
  }

  getRequiredFields(): string[] {
    return this.schema.required || []
  }

  getProperties(): Record<string, JsonSchema> {
    return this.schema.properties || {}
  }

  getItemsSchema(): JsonSchema | undefined {
    return this.schema.items
  }

  getEnumValues(): string[] {
    return this.schema.enum || []
  }

  getPattern(): string | undefined {
    return this.schema.pattern
  }

  getMinLength(): number | undefined {
    return this.schema.minLength
  }

  getMaxLength(): number | undefined {
    return this.schema.maxLength
  }

  getMinimum(): number | undefined {
    return this.schema.minimum
  }

  getMaximum(): number | undefined {
    return this.schema.maximum
  }

  getFormat(): string | undefined {
    return this.schema.format
  }

  getDefaultValue(): unknown {
    return this.schema.default
  }

  getErrorMessage(): JsonSchema['errorMessage'] {
    return this.schema.errorMessage || {}
  }

  getDependsOn(): string | undefined {
    return this.schema.dependsOn
  }

  getEnumMapping(): Record<string, string[]> | undefined {
    return this.schema.enumMapping
  }

  isRequired(fieldName: string): boolean {
    return this.getRequiredFields().includes(fieldName)
  }

  hasProperties(): boolean {
    return !!this.schema.properties && Object.keys(this.schema.properties).length > 0
  }

  hasItems(): boolean {
    return !!this.schema.items
  }

  isComplexType(): boolean {
    const type = this.getType()
    return type === 'object' || type === 'array'
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!this.schema.type) {
      errors.push('缺少必需的 type 字段')
    }

    if (this.schema.type === 'object' && !this.schema.properties) {
      errors.push('object 类型必须包含 properties 字段')
    }

    if (this.schema.type === 'array' && !this.schema.items) {
      errors.push('array 类型必须包含 items 字段')
    }

    if (this.schema.enumMapping && !this.schema.dependsOn) {
      errors.push('enumMapping 必须配合 dependsOn 使用')
    }

    if (this.schema.minLength !== undefined && this.schema.maxLength !== undefined) {
      if (this.schema.minLength > this.schema.maxLength) {
        errors.push('minLength 不能大于 maxLength')
      }
    }

    if (this.schema.minimum !== undefined && this.schema.maximum !== undefined) {
      if (this.schema.minimum > this.schema.maximum) {
        errors.push('minimum 不能大于 maximum')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  getFieldParser(fieldName: string): SchemaParser | null {
    const properties = this.getProperties()
    if (properties[fieldName]) {
      return new SchemaParser(properties[fieldName])
    }
    return null
  }

  getItemsParser(): SchemaParser | null {
    if (this.getItemsSchema()) {
      return new SchemaParser(this.getItemsSchema()!)
    }
    return null
  }

  toJson(): string {
    return JSON.stringify(this.schema, null, 2)
  }

  getSchema(): JsonSchema {
    return this.schema
  }
}
