import DiffMatchPatch from 'diff-match-patch';
import type { Diff, LineDiff, CompareOptions } from '../types';

const dmp = new DiffMatchPatch();

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function computeCharDiff(leftText: string, rightText: string, ignoreWhitespace: boolean = false): Diff[] {
  const left = ignoreWhitespace ? normalizeWhitespace(leftText) : leftText;
  const right = ignoreWhitespace ? normalizeWhitespace(rightText) : rightText;
  
  const rawDiffs = dmp.diff_main(left, right);
  dmp.diff_cleanupSemantic(rawDiffs);
  
  return rawDiffs.map(([type, text]) => {
    let diffType: Diff['type'];
    switch (type) {
      case DiffMatchPatch.DIFF_INSERT:
        diffType = 'insert';
        break;
      case DiffMatchPatch.DIFF_DELETE:
        diffType = 'delete';
        break;
      case DiffMatchPatch.DIFF_EQUAL:
      default:
        diffType = 'equal';
        break;
    }
    return { type: diffType, text };
  });
}

export function computeLineDiff(leftText: string, rightText: string, ignoreWhitespace: boolean = false): LineDiff[] {
  const leftLines = leftText.split('\n');
  const rightLines = rightText.split('\n');
  const maxLines = Math.max(leftLines.length, rightLines.length);
  
  const result: LineDiff[] = [];
  
  for (let i = 0; i < maxLines; i++) {
    const leftLine = leftLines[i] || '';
    const rightLine = rightLines[i] || '';
    
    const charDiffs = computeCharDiff(leftLine, rightLine, ignoreWhitespace);
    const isModified = charDiffs.some(d => d.type !== 'equal');
    
    result.push({
      lineNumber: i + 1,
      leftLine: ignoreWhitespace ? normalizeWhitespace(leftLine) : leftLine,
      rightLine: ignoreWhitespace ? normalizeWhitespace(rightLine) : rightLine,
      charDiffs,
      isModified,
    });
  }
  
  return result;
}

export function computeDiff(leftText: string, rightText: string, options: CompareOptions): Diff[] | LineDiff[] {
  if (options.mode === 'char') {
    return computeCharDiff(leftText, rightText, options.ignoreWhitespace);
  }
  return computeLineDiff(leftText, rightText, options.ignoreWhitespace);
}

export function exportToHTML(leftText: string, rightText: string, options: CompareOptions): string {
  const diffs = computeDiff(leftText, rightText, options) as Diff[];
  
  const diffHtml = diffs.map(diff => {
    let bgColor: string;
    let textColor: string;
    switch (diff.type) {
      case 'insert':
        bgColor = '#dcfce7';
        textColor = '#166534';
        break;
      case 'delete':
        bgColor = '#fee2e2';
        textColor = '#991b1b';
        break;
      case 'modify':
        bgColor = '#fef9c3';
        textColor = '#854d0e';
        break;
      default:
        bgColor = 'transparent';
        textColor = '#374151';
        break;
    }
    
    const escapedText = diff.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    
    return `<span style="background-color: ${bgColor}; color: ${textColor}; padding: 2px 4px; border-radius: 2px;">${escapedText}</span>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>文本差异对比报告</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 1200px; margin: 0 auto; background: #f8fafc; }
    .header { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
    .header h1 { color: #1e293b; margin: 0; }
    .header p { color: #64748b; margin: 5px 0 0; }
    .content { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .legend { display: flex; gap: 20px; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; }
    .legend-item { display: flex; align-items: center; gap: 8px; }
    .legend-color { width: 20px; height: 20px; border-radius: 4px; }
    .legend-text { font-size: 14px; color: #64748b; }
    .diff-content { font-family: 'Consolas', 'Monaco', monospace; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-all; }
    .stats { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>文本差异对比报告</h1>
    <p>生成时间: ${new Date().toLocaleString('zh-CN')} | 对比模式: ${options.mode === 'char' ? '字符级' : '行级'} | 忽略空白: ${options.ignoreWhitespace ? '是' : '否'}</p>
  </div>
  <div class="content">
    <div class="legend">
      <div class="legend-item"><div class="legend-color" style="background: #dcfce7;"></div><span class="legend-text">新增</span></div>
      <div class="legend-item"><div class="legend-color" style="background: #fee2e2;"></div><span class="legend-text">删除</span></div>
      <div class="legend-item"><div class="legend-color" style="background: #fef9c3;"></div><span class="legend-text">修改</span></div>
    </div>
    <div class="diff-content">${diffHtml}</div>
    <div class="stats">
      <p>左侧文本长度: ${leftText.length} 字符</p>
      <p>右侧文本长度: ${rightText.length} 字符</p>
    </div>
  </div>
</body>
</html>`;
}
