import { useState, useCallback } from 'react';
import { ElfParser, getMachineName } from '../parser/ElfParser';
import { ElfFile, ParseResult } from '../parser/ElfTypes';

interface UseElfParserReturn {
  elfFile: ElfFile | null;
  error: string | null;
  isParsing: boolean;
  isComputingHashes: boolean;
  hashProgress: number;
  parseFile: (file: File) => Promise<void>;
  computeAllHashes: () => Promise<void>;
  clear: () => void;
  getMachineName: (machine: number) => string;
}

export function useElfParser(): UseElfParserReturn {
  const [elfFile, setElfFile] = useState<ElfFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isComputingHashes, setIsComputingHashes] = useState(false);
  const [hashProgress, setHashProgress] = useState(0);

  const parseFile = useCallback(async (file: File) => {
    setIsParsing(true);
    setError(null);
    setElfFile(null);
    setIsComputingHashes(false);
    setHashProgress(0);

    try {
      const buffer = await file.arrayBuffer();
      const result: ParseResult = ElfParser.parseBuffer(buffer, file.name);

      if (result.success && result.data) {
        setElfFile(result.data);
      } else {
        setError(result.error || 'Failed to parse ELF file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error reading file');
    } finally {
      setIsParsing(false);
    }
  }, []);

  const computeAllHashes = useCallback(async () => {
    if (!elfFile) return;

    setIsComputingHashes(true);
    setHashProgress(0);

    try {
      const totalSegments = elfFile.programHeaders.filter(ph => ph.p_filesz > 0n).length +
                            elfFile.sectionHeaders.filter(sh => sh.sh_size > 0n).length;
      let completed = 0;

      const originalComputeAllSegmentHashes = ElfParser.computeAllSegmentHashes;
      const result = await originalComputeAllSegmentHashes(elfFile);

      setHashProgress(100);
      setElfFile(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error computing hashes');
    } finally {
      setIsComputingHashes(false);
    }
  }, [elfFile]);

  const clear = useCallback(() => {
    setElfFile(null);
    setError(null);
    setIsParsing(false);
    setIsComputingHashes(false);
    setHashProgress(0);
  }, []);

  return {
    elfFile,
    error,
    isParsing,
    isComputingHashes,
    hashProgress,
    parseFile,
    computeAllHashes,
    clear,
    getMachineName,
  };
}
