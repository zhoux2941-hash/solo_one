export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export type StringPattern = 'name' | 'email' | 'phone' | 'address' | 'sentence' | 'word' | 'uuid' | 'url' | 'date' | 'custom' | 'enum';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface MockApiConfig {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  delay: number;
  statusCode: number;
  responseData: any;
  isEnabled: boolean;
  createdAt: number;
}

export interface FieldRule {
  minLength?: number;
  maxLength?: number;
  pattern?: StringPattern;
  customPattern?: string;
  
  min?: number;
  max?: number;
  isInteger?: boolean;
  decimalPlaces?: number;
  
  trueProbability?: number;
  
  arrayMinLength?: number;
  arrayMaxLength?: number;
  arrayItemType?: FieldType;
  arrayItemRules?: FieldRule;
  isUniqueItems?: boolean;
  
  enumValues?: string[];
  
  objectFields?: FieldConfig[];
}

export interface FieldConfig {
  id: string;
  name: string;
  type: FieldType;
  rules: FieldRule;
  level: number;
  parentId?: string;
  children?: FieldConfig[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: FieldConfig[];
}

export interface AppState {
  fields: FieldConfig[];
  generatedData: any[];
  dataCount: number;
  selectedTemplate: string | null;
  isGenerating: boolean;
}
