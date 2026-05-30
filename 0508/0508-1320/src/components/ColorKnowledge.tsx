import { RoleType, ColorInfo } from '../types';
import { Palette, Star, Sparkles } from 'lucide-react';

interface ColorKnowledgeProps {
  roleType: RoleType | undefined;
}

const ColorCard = ({ color, type }: { color: ColorInfo; type: string }) => (
  <div className="group flex flex-col items-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
    <div
      className="w-14 h-14 rounded-full border-4 border-amber-200 shadow-inner group-hover:scale-110 transition-transform duration-300"
      style={{ backgroundColor: color.color }}
    />
    <span className="mt-2 text-sm font-medium text-amber-900">{color.name}</span>
    <span className="text-xs text-amber-600 text-center mt-1 leading-tight">{color.meaning}</span>
  </div>
);

const ColorKnowledge = ({ roleType }: ColorKnowledgeProps) => {
  if (!roleType) return null;

  const sectionIcon = (type: string) => {
    switch (type) {
      case 'main':
        return <Palette className="w-5 h-5 text-red-700" />;
      case 'secondary':
        return <Star className="w-5 h-5 text-amber-700" />;
      case 'accent':
        return <Sparkles className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const sectionTitle = (type: string) => {
    switch (type) {
      case 'main':
        return '主色调';
      case 'secondary':
        return '辅色调';
      case 'accent':
        return '点缀色';
      default:
        return '';
    }
  };

  const sectionColors = (type: string) => {
    switch (type) {
      case 'main':
        return roleType.mainColors;
      case 'secondary':
        return roleType.secondaryColors;
      case 'accent':
        return roleType.accentColors;
      default:
        return [];
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-amber-200">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-amber-900 mb-2">{roleType.name}</h3>
        <p className="text-amber-700 leading-relaxed">{roleType.description}</p>
      </div>

      {['main', 'secondary', 'accent'].map((type) => (
        <div key={type} className="mb-6 last:mb-0">
          <div className="flex items-center gap-2 mb-3">
            {sectionIcon(type)}
            <h4 className="font-semibold text-amber-800">{sectionTitle(type)}</h4>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {sectionColors(type).map((color, index) => (
              <ColorCard key={index} color={color} type={type} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ColorKnowledge;
