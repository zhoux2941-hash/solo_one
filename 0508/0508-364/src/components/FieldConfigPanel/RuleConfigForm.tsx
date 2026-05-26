import { FieldConfig, StringPattern, FieldType } from '../../types';

interface RuleConfigFormProps {
  field: FieldConfig;
  onRuleChange: (rules: Partial<FieldConfig['rules']>) => void;
}

const stringPatterns: { value: StringPattern; label: string }[] = [
  { value: 'name', label: '姓名' },
  { value: 'email', label: '邮箱' },
  { value: 'phone', label: '手机号' },
  { value: 'address', label: '地址' },
  { value: 'sentence', label: '句子' },
  { value: 'word', label: '单词' },
  { value: 'uuid', label: 'UUID' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: '日期' },
  { value: 'custom', label: '自定义' },
  { value: 'enum', label: '预设值' },
];

export function RuleConfigForm({ field, onRuleChange }: RuleConfigFormProps) {
  const { type, rules } = field;

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3">
      {type === 'string' && (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">格式</label>
            <select
              value={rules.pattern || 'word'}
              onChange={(e) => onRuleChange({ pattern: e.target.value as StringPattern })}
              className="w-full h-7 px-2 text-xs rounded bg-slate-700/50 border border-slate-600 text-slate-200"
            >
              {stringPatterns.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          {rules.pattern === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">最小长度</label>
                <input
                  type="number"
                  value={rules.minLength ?? 5}
                  onChange={(e) => onRuleChange({ minLength: Number(e.target.value) })}
                  className="w-full h-7 px-2 text-xs rounded bg-slate-700/50 border border-slate-600 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">最大长度</label>
                <input
                  type="number"
                  value={rules.maxLength ?? 10}
                  onChange={(e) => onRuleChange({ maxLength: Number(e.target.value) })}
                  className="w-full h-7 px-2 text-xs rounded bg-slate-700/50 border border-slate-600 text-slate-200"
                />
              </div>
            </div>
          )}
          
          {rules.pattern === 'enum' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">预设值（逗号分隔）</label>
              <input
                type="text"
                value={(rules.enumValues || []).join(', ')}
                placeholder="vue, react, angular"
                onChange={(e) => {
                  const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                  onRuleChange({ enumValues: values });
                }}
                className="w-full h-7 px-2 text-xs rounded bg-slate-700/50 border border-slate-600 text-slate-200"
              />
              {rules.enumValues && rules.enumValues.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  共 {rules.enumValues.length} 个值
                </p>
              )}
            </div>
          )}
        </>
      )}

      {type === 'number' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">最小值</label>
              <input
                type="number"
                value={rules.min ?? 0}
                onChange={(e) => onRuleChange({ min: Number(e.target.value) })}
                className="w-full h-7 px-2 text-xs rounded bg-slate-700/50 border border-slate-600 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">最大值</label>
              <input
                type="number"
                value={rules.max ?? 100}
                onChange={(e) => onRuleChange({ max: Number(e.target.value) })}
                className="w-full h-7 px-2 text-xs rounded bg-slate-700/50 border border-slate-600 text-slate-200"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rules.isInteger ?? true}
                onChange={(e) => onRuleChange({ isInteger: e.target.checked })}
                className="w-3 h-3 rounded bg-slate-700 border-slate-600 text-cyan-500"
              />
              <span className="text-xs text-slate-300">整数</span>
            </label>
            {!rules.isInteger && (
              <div>
                <label className="text-xs text-slate-400 mr-2">小数位</label>
                <input
                  type="number"
                  value={rules.decimalPlaces ?? 2}
                  min={0}
                  max={10}
                  onChange={(e) => onRuleChange({ decimalPlaces: Number(e.target.value) })}
                  className="w-16 h-7 px-2 text-xs rounded bg-slate-700/50 border border-slate-600 text-slate-200"
                />
              </div>
            )}
          </div>
        </>
      )}

      {type === 'boolean' && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            True 概率: {Math.round((rules.trueProbability ?? 0.5) * 100)}%
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={rules.trueProbability ?? 0.5}
            onChange={(e) => onRuleChange({ trueProbability: Number(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      )}

      {type === 'array' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">最小长度</label>
              <input
                type="number"
                value={rules.arrayMinLength ?? 1}
                onChange={(e) => onRuleChange({ arrayMinLength: Number(e.target.value) })}
                className="w-full h-7 px-2 text-xs rounded bg-slate-700/50 border border-slate-600 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">最大长度</label>
              <input
                type="number"
                value={rules.arrayMaxLength ?? 5}
                onChange={(e) => onRuleChange({ arrayMaxLength: Number(e.target.value) })}
                className="w-full h-7 px-2 text-xs rounded bg-slate-700/50 border border-slate-600 text-slate-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">子项类型</label>
            <select
              value={rules.arrayItemType || 'string'}
              onChange={(e) => onRuleChange({ arrayItemType: e.target.value as FieldType })}
              className="w-full h-7 px-2 text-xs rounded bg-slate-700/50 border border-slate-600 text-slate-200"
            >
              <option value="string">字符串</option>
              <option value="number">数字</option>
              <option value="boolean">布尔</option>
              <option value="object">对象</option>
            </select>
          </div>
          
          {rules.arrayItemType === 'string' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">子项格式</label>
              <select
                value={rules.arrayItemRules?.pattern || 'word'}
                onChange={(e) => {
                  const newRules = { ...rules.arrayItemRules, pattern: e.target.value };
                  if (e.target.value !== 'enum') {
                    delete (newRules as any).enumValues;
                  }
                  onRuleChange({ arrayItemRules: newRules });
                }}
                className="w-full h-7 px-2 text-xs rounded bg-slate-700/50 border border-slate-600 text-slate-200"
              >
                {stringPatterns.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {rules.arrayItemType === 'string' && rules.arrayItemRules?.pattern === 'enum' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">预设值（逗号分隔）</label>
              <input
                type="text"
                value={(rules.arrayItemRules?.enumValues || []).join(', ')}
                placeholder="vue, react, angular"
                onChange={(e) => {
                  const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                  const newRules = { ...rules.arrayItemRules, enumValues: values };
                  onRuleChange({ arrayItemRules: newRules });
                }}
                className="w-full h-7 px-2 text-xs rounded bg-slate-700/50 border border-slate-600 text-slate-200"
              />
              {rules.arrayItemRules?.enumValues && rules.arrayItemRules.enumValues.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  共 {rules.arrayItemRules.enumValues.length} 个值
                </p>
              )}
            </div>
          )}
          
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rules.isUniqueItems ?? false}
                onChange={(e) => onRuleChange({ isUniqueItems: e.target.checked })}
                className="w-3 h-3 rounded bg-slate-700 border-slate-600 text-cyan-500"
              />
              <span className="text-xs text-slate-300">不重复取值</span>
            </label>
          </div>
        </>
      )}

      {type === 'object' && (
        <div className="text-xs text-slate-400">
          <p>点击「添加子字段」按钮添加对象属性</p>
        </div>
      )}
    </div>
  );
}
