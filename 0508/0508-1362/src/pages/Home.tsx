import { useState, useCallback } from 'react';
import { useElfParser } from '../hooks/useElfParser';
import { FileUpload } from '../components/FileUpload';
import { ElfHeaderView } from '../components/ElfHeaderView';
import { ProgramHeaderTable } from '../components/ProgramHeaderTable';
import { SectionHeaderTable } from '../components/SectionHeaderTable';
import { HexViewer } from '../components/HexViewer';
import { TabNavigation, TabType } from '../components/TabNavigation';
import { EI_CLASS } from '../parser/ElfConstants';
import { FileText, RotateCcw, Github, Hash, Loader2 } from 'lucide-react';

export default function Home() {
  const {
    elfFile,
    error,
    isParsing,
    isComputingHashes,
    parseFile,
    computeAllHashes,
    clear,
  } = useElfParser();
  const [activeTab, setActiveTab] = useState<TabType>('header');
  const [highlightOffset, setHighlightOffset] = useState<bigint | undefined>(undefined);
  const [highlightSize, setHighlightSize] = useState<bigint | undefined>(undefined);

  const hasAnyHash = elfFile?.programHeaders.some(ph => ph.hash) ||
                     elfFile?.sectionHeaders.some(sh => sh.hash);

  const handleFileSelect = useCallback((file: File) => {
    setActiveTab('header');
    setHighlightOffset(undefined);
    setHighlightSize(undefined);
    parseFile(file);
  }, [parseFile]);

  const handleJumpToOffset = useCallback((offset: bigint, size: bigint) => {
    setHighlightOffset(offset);
    setHighlightSize(size);
    setActiveTab('hex');
  }, []);

  const handleClear = useCallback(() => {
    clear();
    setActiveTab('header');
    setHighlightOffset(undefined);
    setHighlightSize(undefined);
  }, [clear]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const is64Bit = elfFile ? elfFile.header.ei_class === EI_CLASS.ELFCLASS64 : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
      
      <header className="relative z-10 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ELF Parser
              </h1>
              <p className="text-xs text-slate-500">可执行与可链接格式解析器</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {elfFile && !hasAnyHash && (
              <button
                onClick={computeAllHashes}
                disabled={isComputingHashes}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-70 text-white transition-colors"
              >
                {isComputingHashes ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Hash className="w-4 h-4" />
                )}
                {isComputingHashes ? '计算中...' : '计算所有段哈希'}
              </button>
            )}
            {elfFile && (
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
                重新上传
              </button>
            )}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1600px] mx-auto px-6 py-8">
        {!elfFile ? (
          <div className="max-w-2xl mx-auto py-16 animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                分析 ELF 二进制文件
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                上传 ELF 格式文件，在线解析文件头、程序头表、节头表，
                支持 x86、ARM、RISC-V 等多种架构识别，附带完整的十六进制查看器。
              </p>
            </div>
            <FileUpload
              onFileSelect={handleFileSelect}
              isParsing={isParsing}
              error={error}
            />
            <div className="mt-12 grid grid-cols-3 gap-6">
              {[
                { title: '文件头解析', desc: '魔数、架构、入口点等关键信息' },
                { title: '段表分析', desc: '程序头与节头的完整表格展示' },
                { title: '十六进制视图', desc: '原始二进制数据的交互式浏览' },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="text-sm font-semibold text-slate-200 mb-1">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-slate-100">{elfFile.fileName}</div>
                  <div className="text-sm text-slate-400">
                    {formatFileSize(elfFile.fileSize)} · {is64Bit ? 'ELF64' : 'ELF32'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {elfFile.programHeaders.length} 程序头
                </span>
                <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {elfFile.sectionHeaders.length} 节头
                </span>
              </div>
            </div>

            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              programHeaderCount={elfFile.programHeaders.length}
              sectionHeaderCount={elfFile.sectionHeaders.length}
            />

            <div className="min-h-[600px]">
              {activeTab === 'header' && (
                <ElfHeaderView
                  header={elfFile.header}
                  architecture={elfFile.architecture}
                />
              )}
              {activeTab === 'program' && (
                <ProgramHeaderTable
                  headers={elfFile.programHeaders}
                  is64Bit={is64Bit}
                  isComputingHashes={isComputingHashes}
                />
              )}
              {activeTab === 'section' && (
                <SectionHeaderTable
                  headers={elfFile.sectionHeaders}
                  is64Bit={is64Bit}
                  onJumpToOffset={handleJumpToOffset}
                  isComputingHashes={isComputingHashes}
                />
              )}
              {activeTab === 'hex' && (
                <HexViewer
                  data={elfFile.rawData}
                  highlightOffset={highlightOffset}
                  highlightSize={highlightSize}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-slate-800 mt-16 py-6">
        <div className="max-w-[1600px] mx-auto px-6 text-center text-sm text-slate-500">
          ELF Parser · 纯前端解析，保护您的隐私 · 支持 x86、ARM、RISC-V 等架构
        </div>
      </footer>
    </div>
  );
}
