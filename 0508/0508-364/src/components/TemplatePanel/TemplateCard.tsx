import { Users, ShoppingBag, FileText, ShoppingCart } from 'lucide-react';
import { Template } from '../../types';

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onClick: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  'users': <Users className="w-5 h-5" />,
  'shopping-bag': <ShoppingBag className="w-5 h-5" />,
  'file-text': <FileText className="w-5 h-5" />,
  'shopping-cart': <ShoppingCart className="w-5 h-5" />,
};

export function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg text-left transition-all ${
        isSelected
          ? 'bg-cyan-500/20 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
          : 'bg-slate-800/50 border-2 border-transparent hover:bg-slate-800 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-md ${
          isSelected ? 'bg-cyan-500/30 text-cyan-400' : 'bg-slate-700/50 text-slate-400'
        }`}>
          {iconMap[template.icon] || <FileText className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium mb-1 ${
            isSelected ? 'text-cyan-300' : 'text-slate-200'
          }`}>
            {template.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2">
            {template.description}
          </p>
          <p className="text-xs text-slate-600 mt-2">
            {template.fields.length} 个字段
          </p>
        </div>
      </div>
    </button>
  );
}
