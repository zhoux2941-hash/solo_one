import Header from '@/components/Header';
import InventionSelector from '@/components/InventionSelector';
import WorldMap from '@/components/WorldMap';
import InfoPanel from '@/components/InfoPanel';
import NodeDetailModal from '@/components/NodeDetailModal';
import Legend from '@/components/Legend';
import Tips from '@/components/Tips';

export default function Home() {
  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: '#0a0e17' }}
    >
      <Header />
      <div className="flex items-center justify-center py-2" style={{ backgroundColor: 'rgba(10,14,23,0.6)' }}>
        <InventionSelector />
      </div>
      <div className="flex-1 relative overflow-hidden">
        <WorldMap />
        <Legend />
        <Tips />
        <InfoPanel />
        <NodeDetailModal />
      </div>
    </div>
  );
}
