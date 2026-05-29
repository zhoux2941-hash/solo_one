import { FormFieldProps } from '../types'
import { StringField } from './StringField'
import { NumberField } from './NumberField'
import { BooleanField } from './BooleanField'
import { SelectField } from './SelectField'
import { ArrayField } from './ArrayField'
import { ObjectField } from './ObjectField'

export const FormField = ({ schema, name, title, required }: FormFieldProps) => {
  if (!title && !schema.title) {
    const lastPart = name.split('.').pop()
    title = lastPart || ''
  }

  if (schema.enum && schema.enum.length > 0) {
    return <SelectField schema={schema} name={name} title={title || schema.title || ''} required={required} />
  }

  switch (schema.type) {
    case 'string':
      return <StringField schema={schema} name={name} title={title || schema.title || ''} required={required} />
    case 'number':
      return <NumberField schema={schema} name={name} title={title || schema.title || ''} required={required} />
    case 'boolean':
      return <BooleanField schema={schema} name={name} title={title || schema.title || ''} required={required} />
    case 'array':
      return <ArrayField schema={schema} name={name} title={title || schema.title || ''} required={required} />
    case 'object':
      return <ObjectField schema={schema} name={name} title={title || schema.title || ''} required={required} />
    default:
      return null
  }
}
