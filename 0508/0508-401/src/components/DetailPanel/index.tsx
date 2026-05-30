import React from 'react';
import { NianhuaLocation } from '../../types';
import ImageGallery from '../ImageGallery';
import { MapPin, Palette, BookOpen, Info } from 'lucide-react';

interface DetailPanelProps {
  location: NianhuaLocation | null;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ location }) => {
  if (!location) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
            <MapPin className="text-amber-600" size={48} />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">选择一个年画产地</h3>
          <p className="text-gray-500 max-w-xs">
            点击地图上的红色标记点，查看该产地的年画艺术特色、风格特点和代表作品
          </p>
          
          <div className="mt-8 grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/60 rounded-lg p-4">
              <div className="text-2xl mb-1">🎨</div>
              <div className="text-sm font-medium text-gray-700">8个产地</div>
              <div className="text-xs text-gray-500">遍布大江南北</div>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <div className="text-2xl mb-1">🖼️</div>
              <div className="text-sm font-medium text-gray-700">30+画作</div>
              <div className="text-xs text-gray-500">精选代表作</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="bg-gradient-to-r from-red-800 to-red-700 text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{location.name}</h2>
            <p className="text-red-200 text-sm mt-1">{location.englishName}</p>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
            {location.representativeWorks.length} 幅作品
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <h4 className="flex items-center gap-2 text-gray-800 font-semibold mb-3">
            <Info size={18} className="text-amber-600" />
            产地简介
          </h4>
          <p className="text-gray-600 leading-relaxed text-sm">
            {location.description}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <h4 className="flex items-center gap-2 text-gray-800 font-semibold mb-4">
            <Palette size={18} className="text-red-600" />
            风格特点
          </h4>
          <div className="flex flex-wrap gap-2">
            {location.styleFeatures.map((feature, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 rounded-full text-sm font-medium border border-red-200"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <h4 className="flex items-center gap-2 text-gray-800 font-semibold mb-4">
            <BookOpen size={18} className="text-amber-600" />
            常见主题
          </h4>
          <div className="space-y-2">
            {location.commonThemes.map((theme, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                <span className="text-gray-600">{theme}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <ImageGallery images={location.representativeWorks} />
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;
