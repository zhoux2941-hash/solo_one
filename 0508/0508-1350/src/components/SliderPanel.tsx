import { useColorStore } from '@/hooks/useColorStore';
import ColorSlider from './ColorSlider';
import { Shuffle } from 'lucide-react';

export default function SliderPanel() {
  const { red, green, blue, setRed, setGreen, setBlue, randomize } = useColorStore();

  return (
    <div className="flex flex-col gap-10 w-full max-w-xs p-8 bg-gray-900/50 rounded-2xl backdrop-blur-sm border border-gray-800">
      <h2 className="text-2xl font-bold text-white text-center mb-2 tracking-wide">
        色光强度控制
      </h2>
      <ColorSlider
        label="R"
        value={red}
        color="#FF4444"
        onChange={setRed}
      />
      <ColorSlider
        label="G"
        value={green}
        color="#44FF44"
        onChange={setGreen}
      />
      <ColorSlider
        label="B"
        value={blue}
        color="#4444FF"
        onChange={setBlue}
      />
      <button
        onClick={randomize}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 transition-all duration-200 active:scale-95 cursor-pointer"
      >
        <Shuffle size={18} />
        <span className="text-sm font-medium tracking-wide">随机颜色</span>
      </button>
    </div>
  );
}
