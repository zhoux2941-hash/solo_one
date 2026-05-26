import { create } from 'zustand';
import { FieldConfig, FieldType, AppState } from '../types';
import { generateId, generateMockData } from '../utils/mockGenerator';
import { getTemplateById } from '../utils/templates';

const STORAGE_KEY = 'json-mock-generator-state';

function loadFromStorage(): Partial<AppState> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('加载保存的数据失败:', e);
  }
  return null;
}

function saveToStorage(state: Partial<AppState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      fields: state.fields,
      dataCount: state.dataCount
    }));
  } catch (e) {
    console.error('保存数据失败:', e);
  }
}

const savedState = loadFromStorage();

function createDefaultField(name: string = 'newField', level: number = 0): FieldConfig {
  return {
    id: generateId(),
    name,
    type: 'string',
    rules: {
      pattern: 'word',
      minLength: 5,
      maxLength: 10
    },
    level,
    children: undefined
  };
}

export const useAppStore = create<AppState & {
  addField: (parentId?: string) => void;
  removeField: (id: string, parentId?: string) => void;
  updateField: (id: string, updates: Partial<FieldConfig>, parentId?: string) => void;
  updateFieldType: (id: string, type: FieldType, parentId?: string) => void;
  updateFieldRules: (id: string, rules: Partial<FieldConfig['rules']>, parentId?: string) => void;
  setDataCount: (count: number) => void;
  generateData: () => void;
  applyTemplate: (templateId: string) => void;
  clearFields: () => void;
  resetFields: () => void;
  updateFieldName: (id: string, name: string, parentId?: string) => void;
  addChildField: (parentId: string) => void;
}>((set, get) => ({
  fields: savedState?.fields || [createDefaultField('id', 0), createDefaultField('name', 0)],
  generatedData: [],
  dataCount: savedState?.dataCount || 10,
  selectedTemplate: null,
  isGenerating: false,

  addField: (parentId?: string) => {
    set((state) => {
      const newField = createDefaultField(`field${state.fields.length + 1}`, 0);
      const newFields = [...state.fields, newField];
      saveToStorage({ ...state, fields: newFields });
      return { fields: newFields };
    });
  },

  addChildField: (parentId: string) => {
    set((state) => {
      const updateFieldInTree = (fields: FieldConfig[]): FieldConfig[] => {
        return fields.map(field => {
          if (field.id === parentId) {
            const newLevel = field.level + 1;
            if (newLevel > 2) return field;
            const childField = createDefaultField(`item${(field.children?.length || 0) + 1}`, newLevel);
            return {
              ...field,
              children: [...(field.children || []), childField]
            };
          }
          if (field.children) {
            return { ...field, children: updateFieldInTree(field.children) };
          }
          return field;
        });
      };
      const newFields = updateFieldInTree(state.fields);
      saveToStorage({ ...state, fields: newFields });
      return { fields: newFields };
    });
  },

  removeField: (id: string, parentId?: string) => {
    set((state) => {
      const removeFromTree = (fields: FieldConfig[]): FieldConfig[] => {
        return fields
          .filter(f => f.id !== id)
          .map(field => {
            if (field.children) {
              return { ...field, children: removeFromTree(field.children) };
            }
            return field;
          });
      };
      const newFields = removeFromTree(state.fields);
      saveToStorage({ ...state, fields: newFields });
      return { fields: newFields };
    });
  },

  updateField: (id: string, updates: Partial<FieldConfig>, parentId?: string) => {
    set((state) => {
      const updateInTree = (fields: FieldConfig[]): FieldConfig[] => {
        return fields.map(field => {
          if (field.id === id) {
            return { ...field, ...updates };
          }
          if (field.children) {
            return { ...field, children: updateInTree(field.children) };
          }
          return field;
        });
      };
      const newFields = updateInTree(state.fields);
      saveToStorage({ ...state, fields: newFields });
      return { fields: newFields };
    });
  },

  updateFieldName: (id: string, name: string, parentId?: string) => {
    get().updateField(id, { name }, parentId);
  },

  updateFieldType: (id: string, type: FieldType, parentId?: string) => {
    const rules: Partial<FieldConfig['rules']> = {};
    
    switch (type) {
      case 'string':
        rules.pattern = 'word';
        rules.minLength = 5;
        rules.maxLength = 10;
        break;
      case 'number':
        rules.min = 0;
        rules.max = 100;
        rules.isInteger = true;
        rules.decimalPlaces = 2;
        break;
      case 'boolean':
        rules.trueProbability = 0.5;
        break;
      case 'array':
        rules.arrayMinLength = 1;
        rules.arrayMaxLength = 5;
        rules.arrayItemType = 'string';
        rules.arrayItemRules = {
          pattern: 'word'
        };
        rules.isUniqueItems = false;
        break;
      case 'object':
        break;
    }

    const updates: Partial<FieldConfig> = { type, rules };
    if (type === 'object' || type === 'array') {
      updates.children = undefined;
    }
    get().updateField(id, updates, parentId);
  },

  updateFieldRules: (id: string, rules: Partial<FieldConfig['rules']>, parentId?: string) => {
    set((state) => {
      const updateInTree = (fields: FieldConfig[]): FieldConfig[] => {
        return fields.map(field => {
          if (field.id === id) {
            return { ...field, rules: { ...field.rules, ...rules } };
          }
          if (field.children) {
            return { ...field, children: updateInTree(field.children) };
          }
          return field;
        });
      };
      const newFields = updateInTree(state.fields);
      saveToStorage({ ...state, fields: newFields });
      return { fields: newFields };
    });
  },

  setDataCount: (count: number) => {
    set((state) => {
      saveToStorage({ ...state, dataCount: count });
      return { dataCount: count };
    });
  },

  generateData: () => {
    set({ isGenerating: true });
    setTimeout(() => {
      const { fields, dataCount } = get();
      const data = generateMockData(fields, dataCount);
      set({ generatedData: data, isGenerating: false });
    }, 100);
  },

  applyTemplate: (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template) {
      set((state) => {
        saveToStorage({ ...state, fields: template.fields });
        return { fields: template.fields, selectedTemplate: templateId };
      });
    }
  },

  clearFields: () => {
    set((state) => {
      saveToStorage({ ...state, fields: [] });
      return { fields: [], selectedTemplate: null };
    });
  },

  resetFields: () => {
    const defaultFields = [createDefaultField('id', 0), createDefaultField('name', 0)];
    set((state) => {
      saveToStorage({ ...state, fields: defaultFields });
      return { fields: defaultFields, selectedTemplate: null };
    });
  }
}));
