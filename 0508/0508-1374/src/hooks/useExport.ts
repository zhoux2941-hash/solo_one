import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { exportBoardToText, copyToClipboard, downloadTextFile } from '@/utils/export';

export function useExport() {
  const { currentBoard, boardSize, currentSolutionIndex } = useAppStore();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyToClipboard = async () => {
    const text = exportBoardToText(currentBoard, boardSize, currentSolutionIndex + 1);
    const success = await copyToClipboard(text);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    return success;
  };

  const handleDownload = () => {
    const text = exportBoardToText(currentBoard, boardSize, currentSolutionIndex + 1);
    const filename = `n-queens-${boardSize}x${boardSize}-solution-${currentSolutionIndex + 1}.txt`;
    downloadTextFile(text, filename);
  };

  const getExportText = () => {
    return exportBoardToText(currentBoard, boardSize, currentSolutionIndex + 1);
  };

  return {
    copyToClipboard: handleCopyToClipboard,
    download: handleDownload,
    getExportText,
    copySuccess,
  };
}
