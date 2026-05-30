import React from 'react';
import { SPICES } from '../../data/spices';
import { SpiceCard } from './SpiceCard';
import { SelectedList } from './SelectedList';
import { Leaf } from 'lucide-react';

export const IncenseLibrary: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Leaf className="text-amber-700" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-800">香料库</h2>
          <p className="text-sm text-stone-500">十味经典香料，随心配伍</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SPICES.map((spice, index) => (
          <SpiceCard key={spice.id} spice={spice} index={index} />
        ))}
      </div>

      <SelectedList />
    </div>
  );
};
