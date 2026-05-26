import { FieldType } from '../../types';

interface FieldTypeSelectorProps {
  value: FieldType;
  onChange: (type: FieldType) => void;
}

const typeOptions: { value: FieldType; label: string; color: string }[] = [
  { value: 'string', label: '字符串', color: 'text-emerald-400 bg-emerald-500/20' },
  { value: 'number', label: '数字', color: 'text-orange-400 bg-orange-500/20' },
  { value: 'boolean', label: '布尔', color: 'text-purple-400 bg-purple-500/20' },
  { value: 'array', label: '数组', color: 'text-blue-400 bg-blue-500/20' },
  { value: 'object', label: '对象', color: 'text-pink-400 bg-pink-500/20' },
];

export function FieldTypeSelector({ value, onChange }: FieldTypeSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FieldType)}
      className="h-8 px-2 text-xs rounded-md bg-slate-700/50 border border-slate-600 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
    >
      {typeOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
