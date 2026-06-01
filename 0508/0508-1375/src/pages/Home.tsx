import TextInput from '@/components/TextInput';
import FrequencyChart from '@/components/FrequencyChart';
import HuffmanTreeCanvas from '@/components/HuffmanTreeCanvas';
import EncodingTable from '@/components/EncodingTable';
import CompressionCompare from '@/components/CompressionCompare';
import StepByStepDemo from '@/components/StepByStepDemo';
import ExportButton from '@/components/ExportButton';
import { useHuffmanStore } from '@/hooks/useHuffmanStore';
import { Binary, TreePine } from 'lucide-react';

export default function Home() {
  const inputText = useHuffmanStore(s => s.inputText);

  return (
    <div className="min-h-screen bg-[#060e1a] text-zinc-100">
      <header className="border-b border-zinc-800/50 bg-[#0a1628]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <TreePine size={22} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                <span className="text-amber-400">Huffman</span> 编码可视化
              </h1>
              <p className="text-xs text-zinc-500 -mt-0.5">交互式算法学习工具</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-zinc-600">
            <Binary size={14} />
            <span>变长编码 · 数据压缩</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-[#0d1b2a] rounded-2xl p-5 border border-zinc-800/50 shadow-xl shadow-black/20">
              <TextInput />
            </div>

            <div className="bg-[#0d1b2a] rounded-2xl p-5 border border-zinc-800/50 shadow-xl shadow-black/20">
              <FrequencyChart />
            </div>

            <div className="bg-[#0d1b2a] rounded-2xl p-5 border border-zinc-800/50 shadow-xl shadow-black/20">
              <EncodingTable />
            </div>

            <div className="bg-[#0d1b2a] rounded-2xl p-5 border border-zinc-800/50 shadow-xl shadow-black/20">
              <CompressionCompare />
            </div>

            <ExportButton />
          </div>

          <div className="lg:col-span-8 space-y-5">
            <div className="bg-[#0d1b2a] rounded-2xl border border-zinc-800/50 shadow-xl shadow-black/20 overflow-hidden">
              <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                <TreePine size={18} className="text-amber-400" />
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Huffman树</h2>
              </div>
              <div className="px-3 pb-3" style={{ height: '480px' }}>
                {inputText ? (
                  <HuffmanTreeCanvas />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 border border-zinc-800/30 rounded-xl bg-[#060e1a]">
                    <TreePine size={48} className="mb-3 opacity-30" />
                    <p className="text-sm">输入文本后，Huffman树将在此处显示</p>
                  </div>
                )}
              </div>
            </div>

            <StepByStepDemo />
          </div>
        </div>
      </main>
    </div>
  );
}
