import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Download, Code2, FileCode, Copy, Check, FileJson } from 'lucide-react';
import { createExportData, downloadJson } from '../utils/facePatternExport';

const ExportPanel = () => {
  const { customColors, facePattern } = useStore();
  const [copied, setCopied] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [exporting, setExporting] = useState<'css' | 'ase' | 'json' | null>(null);

  if (!facePattern) {
    return null;
  }

  const selectedCharacter = useStore.getState().characters.find(
    (c) => c.id === facePattern.characterId
  );

  const generateCSSVariables = (): string => {
    const characterName = selectedCharacter?.name || 'face-pattern';
    return `/* 川剧脸谱配色方案 - ${characterName} */\n:root {\n  --face-main: ${customColors.main};\n  --face-secondary: ${customColors.secondary};\n  --face-outline: ${customColors.outline};\n  --face-accent-1: ${customColors.accent1};\n  --face-accent-2: ${customColors.accent2};\n}\n\n/* 使用示例 */\n.face-mask {\n  background-color: var(--face-main);\n  border-color: var(--face-outline);\n  color: var(--face-secondary);\n}`;
  };

  const hexToRgbFloat = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0];
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ];
  };

  const generateASEFile = (): Uint8Array => {
    const colors = [
      { name: 'Main', hex: customColors.main },
      { name: 'Secondary', hex: customColors.secondary },
      { name: 'Outline', hex: customColors.outline },
      { name: 'Accent 1', hex: customColors.accent1 },
      { name: 'Accent 2', hex: customColors.accent2 },
    ];

    const characterName = selectedCharacter?.name || 'FacePattern';
    const groupName = `${characterName} Palette`;

    const writeString = (str: string): Uint8Array => {
      const encoder = new TextEncoder();
      return encoder.encode(str);
    };

    const writeUInt16 = (value: number): Uint8Array => {
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer);
      view.setUint16(0, value, false);
      return new Uint8Array(buffer);
    };

    const writeUInt32 = (value: number): Uint8Array => {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint32(0, value, false);
      return new Uint8Array(buffer);
    };

    const writeFloat32 = (value: number): Uint8Array => {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setFloat32(0, value, false);
      return new Uint8Array(buffer);
    };

    const writeColorEntry = (name: string, hex: string): Uint8Array => {
      const [r, g, b] = hexToRgbFloat(hex);
      const nameBytes = writeString(name);
      const nameLength = writeUInt16(nameBytes.length + 1);
      const blockLength = writeUInt32(2 + nameBytes.length + 1 + 4 + 4 * 3 + 2);
      
      const parts: Uint8Array[] = [
        writeUInt16(0x0001),
        blockLength,
        nameLength,
        nameBytes,
        new Uint8Array([0]),
        writeString('RGB '),
        writeFloat32(r),
        writeFloat32(g),
        writeFloat32(b),
        writeUInt16(0),
      ];
      
      const concatArrays = (arrays: Uint8Array[]): Uint8Array => {
        const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        arrays.forEach((arr) => {
          result.set(arr, offset);
          offset += arr.length;
        });
        return result;
      };
      
      return concatArrays(parts);
    };

    const concatArrays = (arrays: Uint8Array[]): Uint8Array => {
      const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      arrays.forEach((arr) => {
        result.set(arr, offset);
        offset += arr.length;
      });
      return result;
    };

    const colorEntries = colors.map((c) => writeColorEntry(c.name, c.hex));
    const colorsTotalLength = colorEntries.reduce((acc, entry) => acc + entry.length, 0);

    const groupNameBytes = writeString(groupName);
    const groupNameLength = writeUInt16(groupNameBytes.length + 1);
    const groupBlockLength = writeUInt32(
      2 + groupNameBytes.length + 1 + 4 + colorsTotalLength
    );

    const parts: Uint8Array[] = [
      writeString('ASEF'),
      writeUInt32(0x00010000),
      writeUInt32(1 + 2 + groupBlockLength.length + colorsTotalLength),
      writeUInt16(0xC001),
      groupBlockLength,
      groupNameLength,
      groupNameBytes,
      new Uint8Array([0]),
      writeUInt32(colors.length),
      ...colorEntries,
    ];

    return concatArrays(parts);
  };

  const handleExportCSS = async () => {
    const css = generateCSSVariables();
    
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const blob = new Blob([css], { type: 'text/css' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCharacter?.name || 'face-palette'}.css`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleExportASE = () => {
    setExporting('ase');
    try {
      const aseData = generateASEFile();
      const blob = new Blob([aseData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCharacter?.name || 'face-palette'}.ase`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('ASE export failed:', error);
    }
    setTimeout(() => setExporting(null), 1000);
  };

  const handleExportJSON = async () => {
    if (!selectedCharacter) return;

    const exportData = createExportData(facePattern, selectedCharacter.name, customColors);
    const filename = `${selectedCharacter.name}-face-pattern.json`;

    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    } catch {
      downloadJson(exportData, filename);
    }
  };

  const handleDownloadJSON = () => {
    if (!selectedCharacter) return;
    setExporting('json');
    const exportData = createExportData(facePattern, selectedCharacter.name, customColors);
    const filename = `${selectedCharacter.name}-face-pattern.json`;
    downloadJson(exportData, filename);
    setTimeout(() => setExporting(null), 1000);
  };

  return (
    <div className="bg-paper rounded-xl p-6 border-2 border-gold/30 mt-6">
      <h2 className="text-2xl font-display text-ink mb-4 flex items-center gap-2">
        <Download className="w-6 h-6 text-primary" />
        导出方案
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleExportCSS}
          className="flex flex-col items-center gap-3 p-6 bg-paper-light rounded-xl border-2 border-gold/30 hover:border-gold hover:bg-gold/10 transition-all duration-200 group"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
            {copied ? (
              <Check className="w-8 h-8 text-primary" />
            ) : (
              <Code2 className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="text-center">
            <p className="font-display text-lg text-ink">CSS 变量</p>
            <p className="text-xs text-ink-light">复制到剪贴板</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-ink-light mt-1">
            <Copy className="w-3 h-3" />
            {copied ? '已复制!' : '点击复制'}
          </div>
        </button>

        <button
          onClick={handleExportASE}
          disabled={exporting === 'ase'}
          className="flex flex-col items-center gap-3 p-6 bg-paper-light rounded-xl border-2 border-gold/30 hover:border-gold hover:bg-gold/10 transition-all duration-200 group disabled:opacity-50"
        >
          <div className="w-16 h-16 rounded-full bg-stone/10 flex items-center justify-center group-hover:bg-stone/20 transition-colors duration-200">
            <FileCode className="w-8 h-8 text-stone" />
          </div>
          <div className="text-center">
            <p className="font-display text-lg text-ink">Adobe Swatch</p>
            <p className="text-xs text-ink-light">.ase 文件下载</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-ink-light mt-1">
            <Download className="w-3 h-3" />
            {exporting === 'ase' ? '导出中...' : '点击下载'}
          </div>
        </button>

        <button
          onClick={handleExportJSON}
          className="flex flex-col items-center gap-3 p-6 bg-paper-light rounded-xl border-2 border-gold/30 hover:border-gold hover:bg-gold/10 transition-all duration-200 group"
        >
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors duration-200">
            {jsonCopied ? (
              <Check className="w-8 h-8 text-gold-dark" />
            ) : (
              <FileJson className="w-8 h-8 text-gold-dark" />
            )}
          </div>
          <div className="text-center">
            <p className="font-display text-lg text-ink">JSON 数据</p>
            <p className="text-xs text-ink-light">含图层+颜色数据</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-ink-light mt-1">
            <Copy className="w-3 h-3" />
            {jsonCopied ? '已复制!' : '点击复制'}
          </div>
        </button>

        <button
          onClick={handleDownloadJSON}
          disabled={exporting === 'json'}
          className="flex flex-col items-center gap-3 p-6 bg-paper-light rounded-xl border-2 border-gold/30 hover:border-gold hover:bg-gold/10 transition-all duration-200 group disabled:opacity-50"
        >
          <div className="w-16 h-16 rounded-full bg-accent1/10 flex items-center justify-center group-hover:bg-accent1/20 transition-colors duration-200">
            <FileJson className="w-8 h-8 text-accent1" />
          </div>
          <div className="text-center">
            <p className="font-display text-lg text-ink">JSON 下载</p>
            <p className="text-xs text-ink-light">.json 文件下载</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-ink-light mt-1">
            <Download className="w-3 h-3" />
            {exporting === 'json' ? '导出中...' : '点击下载'}
          </div>
        </button>
      </div>

      <div className="mt-4 p-4 bg-ink/5 rounded-lg">
        <p className="text-xs text-ink-light">
          <span className="font-medium text-ink">提示：</span>
          CSS 变量可直接用于网页开发，Adobe Swatch 文件可导入 Photoshop、Illustrator 等设计软件。JSON 格式包含完整的图层结构和路径数据，可用于二次开发。
        </p>
      </div>
    </div>
  );
};

export default ExportPanel;
