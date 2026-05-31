import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Binary, Search, ChevronUp, ChevronDown } from 'lucide-react';

interface HexViewerProps {
  data: ArrayBuffer;
  highlightOffset?: bigint;
  highlightSize?: bigint;
  onClose?: () => void;
}

type ByteGroup = 1 | 2 | 4;

export const HexViewer: React.FC<HexViewerProps> = ({
  data,
  highlightOffset,
  highlightSize,
}) => {
  const [byteGroup, setByteGroup] = useState<ByteGroup>(1);
  const [bytesPerLine, setBytesPerLine] = useState(16);
  const [jumpOffset, setJumpOffset] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);

  const view = new Uint8Array(data);
  const totalRows = Math.ceil(view.length / bytesPerLine);

  const formatHex = (value: number, pad: number = 2) => {
    return value.toString(16).padStart(pad, '0');
  };

  const formatAddress = (value: number) => {
    return `0x${value.toString(16).padStart(8, '0')}`;
  };

  const isHighlighted = useCallback(
    (offset: number) => {
      if (highlightOffset === undefined) return false;
      const start = Number(highlightOffset);
      const end = start + Number(highlightSize || 0);
      return offset >= start && offset < end;
    },
    [highlightOffset, highlightSize]
  );

  const handleJump = useCallback(() => {
    let offset: number;
    if (jumpOffset.startsWith('0x') || jumpOffset.startsWith('0X')) {
      offset = parseInt(jumpOffset, 16);
    } else {
      offset = parseInt(jumpOffset, 10);
    }
    if (!isNaN(offset) && offset >= 0 && offset < view.length) {
      const row = Math.floor(offset / bytesPerLine);
      rowsRef.current[row]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [jumpOffset, bytesPerLine, view.length]);

  const handleSearch = useCallback(() => {
    if (!searchTerm) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const results: number[] = [];
    let searchBytes: Uint8Array;

    if (searchTerm.startsWith('0x') || searchTerm.startsWith('0X')) {
      const hexStr = searchTerm.slice(2).replace(/\s/g, '');
      searchBytes = new Uint8Array(hexStr.length / 2);
      for (let i = 0; i < hexStr.length; i += 2) {
        searchBytes[i / 2] = parseInt(hexStr.slice(i, i + 2), 16);
      }
    } else {
      searchBytes = new TextEncoder().encode(searchTerm);
    }

    for (let i = 0; i <= view.length - searchBytes.length; i++) {
      let match = true;
      for (let j = 0; j < searchBytes.length; j++) {
        if (view[i + j] !== searchBytes[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        results.push(i);
      }
    }

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);

    if (results.length > 0) {
      const row = Math.floor(results[0] / bytesPerLine);
      rowsRef.current[row]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchTerm, bytesPerLine, view]);

  const navigateSearch = (direction: 'prev' | 'next') => {
    if (searchResults.length === 0) return;
    const newIndex =
      direction === 'next'
        ? (currentSearchIndex + 1) % searchResults.length
        : (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(newIndex);
    const row = Math.floor(searchResults[newIndex] / bytesPerLine);
    rowsRef.current[row]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const isSearchResult = (offset: number) => {
    return searchResults.includes(offset);
  };

  const isCurrentSearchResult = (offset: number) => {
    return currentSearchIndex >= 0 && searchResults[currentSearchIndex] === offset;
  };

  const getAsciiChar = (byte: number) => {
    if (byte >= 32 && byte <= 126) {
      return String.fromCharCode(byte);
    }
    return '.';
  };

  const renderRow = (rowIndex: number) => {
    const startOffset = rowIndex * bytesPerLine;
    const hexParts: string[] = [];
    const asciiParts: string[] = [];

    for (let i = 0; i < bytesPerLine; i++) {
      const offset = startOffset + i;
      if (offset < view.length) {
        hexParts.push(formatHex(view[offset]));
        asciiParts.push(getAsciiChar(view[offset]));
      } else {
        hexParts.push('  ');
        asciiParts.push(' ');
      }
    }

    const groupedHex: string[] = [];
    for (let i = 0; i < hexParts.length; i += byteGroup) {
      groupedHex.push(hexParts.slice(i, i + byteGroup).join(''));
    }

    return (
      <div
        key={rowIndex}
        ref={(el) => (rowsRef.current[rowIndex] = el)}
        className="font-mono text-xs flex hover:bg-slate-700/30 transition-colors"
      >
        <div className="w-24 px-4 py-1 text-slate-500 select-none flex-shrink-0">
          {formatAddress(startOffset)}
        </div>
        <div className="flex-1 px-4 py-1 flex gap-4">
          <div className="flex gap-1.5">
            {groupedHex.map((hex, idx) => {
              const byteOffset = startOffset + idx * byteGroup;
              const isSearchHit = isSearchResult(byteOffset);
              const isCurrent = isCurrentSearchResult(byteOffset);
              const isHigh = isHighlighted(byteOffset);
              return (
                <span
                  key={idx}
                  className={`uppercase transition-colors ${
                    isCurrent
                      ? 'bg-yellow-500 text-slate-900 px-0.5 rounded'
                      : isSearchHit
                      ? 'bg-yellow-500/40 text-yellow-200 px-0.5 rounded'
                      : isHigh
                      ? 'bg-blue-500/40 text-blue-200 px-0.5 rounded animate-pulse'
                      : 'text-slate-300'
                  }`}
                >
                  {hex}
                </span>
              );
            })}
          </div>
          <div className="text-slate-400 select-none border-l border-slate-700 pl-4 flex-shrink-0">
            {asciiParts.map((char, idx) => {
              const byteOffset = startOffset + idx;
              const isHigh = isHighlighted(byteOffset);
              const isSearchHit = isSearchResult(byteOffset);
              return (
                <span
                  key={idx}
                  className={`${
                    isHigh ? 'bg-blue-500/40 text-blue-200' : isSearchHit ? 'bg-yellow-500/40 text-yellow-200' : ''
                  }`}
                >
                  {char}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (highlightOffset !== undefined && containerRef.current) {
      const offset = Number(highlightOffset);
      const row = Math.floor(offset / bytesPerLine);
      setTimeout(() => {
        rowsRef.current[row]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightOffset, bytesPerLine]);

  const rows = [];
  for (let i = 0; i < totalRows; i++) {
    rows.push(renderRow(i));
  }

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Binary className="w-6 h-6 text-purple-400" />
          十六进制查看器
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {view.length.toLocaleString()} 字节
          </span>
        </h2>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">分组:</span>
          {[1, 2, 4].map((g) => (
            <button
              key={g}
              onClick={() => setByteGroup(g as ByteGroup)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                byteGroup === g
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {g}B
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">每行:</span>
          {[8, 16, 32].map((b) => (
            <button
              key={b}
              onClick={() => setBytesPerLine(b)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                bytesPerLine === b
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="跳转偏移 (0x...)"
              value={jumpOffset}
              onChange={(e) => setJumpOffset(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJump()}
              className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors pr-8"
            />
            <button
              onClick={handleJump}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-400"
            >
              <Search className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1 flex">
            <input
              type="text"
              placeholder="搜索 (支持 0x... 或文本)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-l-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-1.5 bg-slate-700 border border-l-0 border-slate-700 rounded-r-lg text-slate-400 hover:text-blue-400 hover:bg-slate-600 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            {searchResults.length > 0 && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={() => navigateSearch('prev')}
                  className="p-0.5 text-slate-400 hover:text-slate-200"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <span className="text-xs text-slate-400">
                  {currentSearchIndex + 1}/{searchResults.length}
                </span>
                <button
                  onClick={() => navigateSearch('next')}
                  className="p-0.5 text-slate-400 hover:text-slate-200"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto rounded-lg border border-slate-700 bg-slate-800/30 min-h-[400px]"
      >
        <div className="sticky top-0 z-10 bg-slate-800 font-mono text-xs flex border-b border-slate-700">
          <div className="w-24 px-4 py-2 text-slate-500 select-none flex-shrink-0">地址</div>
          <div className="flex-1 px-4 py-2 text-slate-500 select-none flex gap-4">
            <div className="flex gap-1.5">
              {Array.from({ length: Math.ceil(bytesPerLine / byteGroup) }, (_, i) => (
                <span key={i} className="uppercase w-4 text-center">
                  {formatHex(i * byteGroup)}
                </span>
              ))}
            </div>
            <div className="text-slate-500 border-l border-slate-700 pl-4 flex-shrink-0">ASCII</div>
          </div>
        </div>
        <div className="py-1">{rows}</div>
      </div>
    </div>
  );
};
