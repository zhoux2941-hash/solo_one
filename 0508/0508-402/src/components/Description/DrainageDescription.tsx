import React from 'react';
import { LayoutGrid, Mountain, Shield, CheckCircle2 } from 'lucide-react';
import { City, DrainageDescription, CATEGORY_LABELS } from '../../types';
import { getDescriptionsByCityId } from '../../data/drainageData';
import { cn } from '../../utils';

const ICONS = {
  open_ditch: LayoutGrid,
  terrain: Mountain,
  defense: Shield,
};

interface DrainageDescriptionCardProps {
  description: DrainageDescription;
  index: number;
}

const DrainageDescriptionCard: React.FC<DrainageDescriptionCardProps> = ({ description, index }) => {
  const Icon = ICONS[description.category];

  return (
    <div
      className="bg-cream-50 border border-ochre-200 rounded-xl p-6 scroll-reveal-item"
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-ochre-100 rounded-xl text-ochre-600">
          <Icon size={24} />
        </div>
        <div>
          <h4 className="font-serif text-lg font-bold text-ochre-700">
            {CATEGORY_LABELS[description.category]}
          </h4>
          <p className="text-sm text-slategray-500">{description.title}</p>
        </div>
      </div>

      <div className="scroll-decoration mb-4" />

      <p className="text-slategray-700 leading-relaxed mb-4">
        {description.content}
      </p>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ochre-600 mb-2">设计特点：</p>
        {description.features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-ochre-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slategray-600">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface DrainageDescriptionSectionProps {
  city: City;
  className?: string;
}

export const DrainageDescriptionSection: React.FC<DrainageDescriptionSectionProps> = ({ city, className = '' }) => {
  const descriptions = getDescriptionsByCityId(city.id);

  return (
    <div className={className}>
      <div className="flex items-center gap-3 mb-6">
        <h3 className="font-serif text-2xl font-bold text-ochre-700">
          {city.name} · 排水方式说明
        </h3>
        <div className="flex-1 scroll-decoration" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {descriptions.map((desc, index) => (
          <DrainageDescriptionCard key={desc.id} description={desc} index={index} />
        ))}
      </div>
    </div>
  );
};
