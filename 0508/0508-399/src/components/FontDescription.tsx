import React from 'react';
import type { Period } from '../types';

interface FontDescriptionProps {
  period: Period;
}

export function FontDescription({ period }: FontDescriptionProps) {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-stone-50 rounded-2xl p-8 shadow-lg border border-amber-200/50">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {period.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-stone-800" style={{ fontFamily: 'serif' }}>
            {period.name}匾额书法
          </h2>
          <p className="text-amber-700">{period.yearRange}</p>
        </div>
      </div>
      
      <p className="text-stone-700 leading-relaxed mb-6 text-lg">
        {period.description}
      </p>
      
      <div className="border-t border-amber-200 pt-6">
        <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
          字体特点
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {period.fontFeatures.map((feature, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 bg-white/70 rounded-lg border border-amber-100"
            >
              <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <span className="text-stone-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
