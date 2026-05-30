import React, { useEffect } from 'react';
import { useDougongStore } from '@/store/useDougongStore';
import ControlPanel from '@/components/ControlPanel';
import SectionView2D from '@/components/SectionView2D';
import Dougong3D from '@/components/Dougong3D';
import ComponentList from '@/components/ComponentList';
import ExportButtons from '@/components/ExportButtons';

const Home: React.FC = () => {
  const initDb = useDougongStore((s) => s.initDb);
  const dbReady = useDougongStore((s) => s.dbReady);

  useEffect(() => {
    initDb();
  }, [initDb]);

  if (!dbReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1A1210]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#D4A843] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#8D6E63] font-serif text-sm">加载材等数据…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1A1210] text-[#F5F0E8] overflow-hidden">
      <div className="flex flex-1 min-h-0">
        <div className="w-72 flex-shrink-0 p-3">
          <ControlPanel />
        </div>

        <div className="flex-1 flex flex-col p-3 pl-0 gap-3 min-w-0">
          <div className="flex gap-3 flex-1 min-h-0">
            <div className="flex-1 min-w-0">
              <SectionView2D />
            </div>
            <div className="flex-1 min-w-0">
              <Dougong3D />
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div />
              <ExportButtons />
            </div>
            <ComponentList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
