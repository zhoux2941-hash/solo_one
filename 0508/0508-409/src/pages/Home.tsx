import { PaperCanvas } from '../components/PaperCanvas';
import { FoldControls } from '../components/FoldControls';
import { DrawTools } from '../components/DrawTools';
import { PreviewWindow } from '../components/PreviewWindow';
import { UnfoldButton } from '../components/UnfoldButton';
import { Info } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen py-8 px-4 cloud-pattern">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <div className="inline-block relative">
            <div className="absolute -top-4 -left-8 w-16 h-16 opacity-30">
              <svg viewBox="0 0 64 64" className="w-full h-full text-chinese-red">
                <path
                  fill="currentColor"
                  d="M32 4C16.5 4 4 16.5 4 32s12.5 28 28 28 28-12.5 28-28S47.5 4 32 4zm0 52c-13.2 0-24-10.8-24-24S18.8 8 32 8s24 10.8 24 24-10.8 24-24 24z"
                />
                <path
                  fill="currentColor"
                  d="M32 12c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 36c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16-7.2 16-16 16z"
                />
              </svg>
            </div>
            <div className="absolute -top-4 -right-8 w-16 h-16 opacity-30 transform scale-x-[-1]">
              <svg viewBox="0 0 64 64" className="w-full h-full text-chinese-red">
                <path
                  fill="currentColor"
                  d="M32 4C16.5 4 4 16.5 4 32s12.5 28 28 28 28-12.5 28-28S47.5 4 32 4zm0 52c-13.2 0-24-10.8-24-24S18.8 8 32 8s24 10.8 24 24-10.8 24-24 24z"
                />
                <path
                  fill="currentColor"
                  d="M32 12c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 36c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16-7.2 16-16 16z"
                />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-kai text-chinese-brown mb-2 tracking-wider">
              传统剪纸 · 三折法
            </h1>
            <p className="text-chinese-brown/70 font-song text-lg">
              体验中国传统剪纸艺术，创造精美的对称图案
            </p>
          </div>
        </header>

        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-chinese-gold/20">
          <div className="flex items-start gap-3 p-4 bg-chinese-gold/10 rounded-xl">
            <Info className="w-6 h-6 text-chinese-gold flex-shrink-0 mt-0.5" />
            <div className="text-sm text-chinese-brown/80 font-song space-y-1">
              <p className="font-semibold text-base">使用说明：</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>依次点击左侧「左右对折」「上下对折」「角对角折」三个按钮完成折叠</li>
                <li>折叠完成后，在中间的三角形区域用鼠标绘制想要剪掉的图案</li>
                <li>右上角预览窗口会实时显示展开后的对称效果</li>
                <li>点击下方「展开作品」按钮，欣赏您的精美剪纸作品</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-8 items-start">
          <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2">
            <FoldControls />
          </div>

          <div className="lg:col-start-2 lg:row-start-1 flex flex-col items-center gap-6">
            <PaperCanvas />
            <UnfoldButton />
          </div>

          <div className="lg:col-start-3 lg:row-start-1 lg:row-span-2 flex flex-col gap-6">
            <div className="flex justify-center">
              <PreviewWindow />
            </div>
            <DrawTools />
          </div>
        </div>

        <footer className="mt-16 text-center text-chinese-brown/50 text-sm font-song pb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-chinese-gold/50" />
            <span className="text-chinese-gold">✂</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-chinese-gold/50" />
          </div>
          <p>中国传统剪纸艺术 · 三折法剪纸模拟器</p>
          <p className="text-xs mt-1">剪纸艺术是中国非物质文化遗产，距今已有两千多年历史</p>
        </footer>
      </div>
    </div>
  );
}
