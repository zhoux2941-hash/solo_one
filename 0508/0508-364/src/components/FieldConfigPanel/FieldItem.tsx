import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, Plus } from 'lucide-react';
import { FieldConfig } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { FieldTypeSelector } from './FieldTypeSelector';
import { RuleConfigForm } from './RuleConfigForm';

interface FieldItemProps {
  field: FieldConfig;
  parentId?: string;
}

export function FieldItem({ field, parentId }: FieldItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { updateFieldName, updateFieldType, updateFieldRules, removeField, addChildField } = useAppStore();

  const levelColors = [
    'border-l-cyan-500',
    'border-l-purple-500',
    'border-l-pink-500',
  ];

  const hasChildren = (field.type === 'object' || field.type === 'array') && field.children && field.children.length > 0;
  const canAddChild = field.level < 2 && (field.type === 'object' || field.type === 'array');

  return (
    <div className={`border-l-2 ${levelColors[field.level] || levelColors[0]}`}>
      <div
        className="bg-slate-800/50 hover:bg-slate-800 rounded-r-lg p-3 mb-2 ml-2 transition-colors"
        style={{ marginLeft: `${field.level * 16 + 8}px` }}
      >
        <div className="flex items-center gap-2">
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <input
            type="text"
            value={field.name}
            onChange={(e) => updateFieldName(field.id, e.target.value, parentId)}
            placeholder="字段名"
            className="flex-1 h-8 px-2 text-sm rounded-md bg-slate-700/50 border border-slate-600 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder-slate-500"
          />
          
          <FieldTypeSelector
            value={field.type}
            onChange={(type) => updateFieldType(field.id, type, parentId)}
          />

          {canAddChild && (
            <button
              onClick={() => addChildField(field.id)}
              className="p-1.5 hover:bg-cyan-500/20 rounded-md transition-colors group"
              title="添加子字段"
            >
              <Plus className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
            </button>
          )}
          
          <button
            onClick={() => removeField(field.id, parentId)}
            className="p-1.5 hover:bg-red-500/20 rounded-md transition-colors group"
            title="删除字段"
          >
            <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
          </button>
        </div>

        <RuleConfigForm
          field={field}
          onRuleChange={(rules) => updateFieldRules(field.id, rules, parentId)}
        />
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {field.children!.map((child) => (
            <FieldItem key={child.id} field={child} parentId={field.id} />
          ))}
        </div>
      )}
    </div>
  );
}
