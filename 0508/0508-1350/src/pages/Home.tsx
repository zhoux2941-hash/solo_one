import SliderPanel from '@/components/SliderPanel';
import ColorPreview from '@/components/ColorPreview';
import ColorInfo from '@/components/ColorInfo';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 via-green-500 to-blue-500 bg-clip-text text-transparent">
            三原色光混合实验
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            RGB Additive Color Mixing Experiment
          </p>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
          <SliderPanel />
          <div className="flex flex-col items-center gap-8">
            <ColorPreview />
            <ColorInfo />
          </div>
        </main>

        <footer className="text-center text-gray-600 text-sm py-4">
          拖动左侧滑块调节色光强度，观察混合效果
        </footer>
      </div>
    </div>
  );
}
