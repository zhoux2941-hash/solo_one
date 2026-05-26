import { FieldConfig, FieldRule } from '../types';
import {
  generateName,
  generateEmail,
  generatePhone,
  generateAddress,
  generateWord,
  generateSentence,
  generateUUID,
  generateUrl,
  generateDate,
  generateRandomString,
  generateChineseTitle,
  generateChineseSentence
} from './stringGenerators';
import { generateNumber, generateBoolean, randomInt } from './numberGenerators';

const MAX_NEST_LEVEL = 3;

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateStringByPattern(rule: FieldRule): string {
  const pattern = rule.pattern || 'word';
  const minLength = rule.minLength || 5;
  const maxLength = rule.maxLength || 10;

  switch (pattern) {
    case 'name':
      return generateName();
    case 'email':
      return generateEmail();
    case 'phone':
      return generatePhone();
    case 'address':
      return generateAddress();
    case 'sentence':
      return Math.random() > 0.5 ? generateSentence() : generateChineseSentence();
    case 'word':
      return generateWord();
    case 'uuid':
      return generateUUID();
    case 'url':
      return generateUrl();
    case 'date':
      return generateDate();
    case 'custom':
      return generateRandomString(minLength, maxLength);
    case 'enum':
      if (rule.enumValues && rule.enumValues.length > 0) {
        return randomItem(rule.enumValues);
      }
      return generateRandomString(minLength, maxLength);
    default:
      return generateRandomString(minLength, maxLength);
  }
}

function generateFieldValue(field: FieldConfig, level: number): any {
  if (level > MAX_NEST_LEVEL) {
    return null;
  }

  const { type, rules, children } = field;

  switch (type) {
    case 'string':
      return generateStringByPattern(rules);

    case 'number':
      return generateNumber(
        rules.min ?? 0,
        rules.max ?? 100,
        rules.isInteger ?? true,
        rules.decimalPlaces ?? 2
      );

    case 'boolean':
      return generateBoolean(rules.trueProbability ?? 0.5);

    case 'array': {
      const arrayMinLength = rules.arrayMinLength ?? 1;
      const arrayMaxLength = rules.arrayMaxLength ?? 5;
      let targetLength = randomInt(arrayMinLength, arrayMaxLength);
      const arr: any[] = [];
      const isUnique = rules.isUniqueItems ?? false;
      
      const enumValues = rules.arrayItemRules?.enumValues;
      const hasEnumValues = rules.arrayItemType === 'string' && enumValues && enumValues.length > 0;
      
      if (isUnique && hasEnumValues) {
        const shuffled = shuffleArray(enumValues!);
        const actualLength = Math.min(targetLength, shuffled.length);
        return shuffled.slice(0, actualLength);
      }
      
      let attempts = 0;
      const maxAttempts = targetLength * 10;
      
      while (arr.length < targetLength && attempts < maxAttempts) {
        attempts++;
        let item: any;
        
        if (children && children.length > 0) {
          const obj: Record<string, any> = {};
          children.forEach(child => {
            obj[child.name] = generateFieldValue(child, level + 1);
          });
          item = obj;
          
          if (isUnique) {
            const itemKey = JSON.stringify(item);
            if (arr.some(existing => JSON.stringify(existing) === itemKey)) {
              continue;
            }
          }
        } else if (rules.arrayItemType) {
          const itemConfig: FieldConfig = {
            id: '',
            name: '',
            type: rules.arrayItemType,
            rules: rules.arrayItemRules || {},
            level: level + 1
          };
          item = generateFieldValue(itemConfig, level + 1);
          
          if (isUnique && arr.includes(item)) {
            continue;
          }
        }
        
        if (item !== undefined) {
          arr.push(item);
        }
      }
      
      return arr;
    }

    case 'object': {
      const obj: Record<string, any> = {};
      if (children) {
        children.forEach(child => {
          obj[child.name] = generateFieldValue(child, level + 1);
        });
      }
      return obj;
    }

    default:
      return null;
  }
}

export function generateMockData(fields: FieldConfig[], count: number): any[] {
  const result: any[] = [];

  for (let i = 0; i < count; i++) {
    const item: Record<string, any> = {};
    fields.forEach(field => {
      item[field.name] = generateFieldValue(field, 0);
    });
    result.push(item);
  }

  return result;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
