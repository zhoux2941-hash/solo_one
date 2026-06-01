export interface HuffmanNode {
  id: string;
  char: string | null;
  freq: number;
  left: HuffmanNode | null;
  right: HuffmanNode | null;
}

export interface BuildStep {
  stepIndex: number;
  description: string;
  forest: HuffmanNode[];
  mergedPair: [HuffmanNode, HuffmanNode] | null;
  mergedNode: HuffmanNode | null;
}

export interface CodeEntry {
  char: string;
  freq: number;
  code: string;
  codeLength: number;
}

export interface CompressionResult {
  originalBits: number;
  huffmanBits: number;
  compressionRatio: number;
  totalChars: number;
}

export interface TreeNodeLayout {
  node: HuffmanNode;
  x: number;
  y: number;
}

let nodeIdCounter = 0;

function resetCounter() {
  nodeIdCounter = 0;
}

function createNode(char: string | null, freq: number, left: HuffmanNode | null = null, right: HuffmanNode | null = null): HuffmanNode {
  return {
    id: `node_${nodeIdCounter++}`,
    char,
    freq,
    left,
    right,
  };
}

export function countFrequencies(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  for (const ch of text) {
    freq.set(ch, (freq.get(ch) || 0) + 1);
  }
  return freq;
}

function cloneNode(node: HuffmanNode): HuffmanNode {
  return {
    ...node,
    id: node.id,
    left: node.left ? cloneNode(node.left) : null,
    right: node.right ? cloneNode(node.right) : null,
  };
}

function cloneForest(forest: HuffmanNode[]): HuffmanNode[] {
  return forest.map(cloneNode);
}

function getNodeDepth(node: HuffmanNode): number {
  if (!node.left && !node.right) return 0;
  return 1 + Math.max(
    node.left ? getNodeDepth(node.left) : 0,
    node.right ? getNodeDepth(node.right) : 0
  );
}

function sortForest(forest: HuffmanNode[]): HuffmanNode[] {
  return forest.sort((a, b) => {
    if (a.freq !== b.freq) return a.freq - b.freq;
    const depthA = getNodeDepth(a);
    const depthB = getNodeDepth(b);
    if (depthA !== depthB) return depthA - depthB;
    return (a.char || '').localeCompare(b.char || '');
  });
}

export function buildHuffmanTree(freqMap: Map<string, number>): {
  root: HuffmanNode | null;
  steps: BuildStep[];
} {
  resetCounter();
  const steps: BuildStep[] = [];

  if (freqMap.size === 0) {
    return { root: null, steps };
  }

  if (freqMap.size === 1) {
    const [[char, freq]] = freqMap.entries();
    const root = createNode(char, freq);
    steps.push({
      stepIndex: 0,
      description: `只有一个字符 "${char === ' ' ? '空格' : char}"，频率为 ${freq}，无需合并`,
      forest: [cloneNode(root)],
      mergedPair: null,
      mergedNode: null,
    });
    return { root, steps };
  }

  let forest: HuffmanNode[] = [];
  for (const [char, freq] of freqMap.entries()) {
    forest.push(createNode(char, freq));
  }

  sortForest(forest);

  steps.push({
    stepIndex: 0,
    description: `初始化：创建 ${forest.length} 个叶子节点，按频率排序`,
    forest: cloneForest(forest),
    mergedPair: null,
    mergedNode: null,
  });

  let stepIndex = 1;

  while (forest.length > 1) {
    const min1 = forest[0];
    const min2 = forest[1];
    const merged = createNode(null, min1.freq + min2.freq, min1, min2);

    const charLabel1 = min1.char === ' ' ? '空格' : (min1.char || `(${min1.freq})`);
    const charLabel2 = min2.char === ' ' ? '空格' : (min2.char || `(${min2.freq})`);

    forest = forest.slice(2);
    forest.push(merged);
    sortForest(forest);

    steps.push({
      stepIndex,
      description: `合并：节点 "${charLabel1}"(频率${min1.freq}) + 节点 "${charLabel2}"(频率${min2.freq}) → 新节点(频率${merged.freq})，剩余 ${forest.length} 个节点`,
      forest: cloneForest(forest),
      mergedPair: [cloneNode(min1), cloneNode(min2)],
      mergedNode: cloneNode(merged),
    });

    stepIndex++;
  }

  return { root: forest[0], steps };
}

export function generateCodes(root: HuffmanNode | null): CodeEntry[] {
  if (!root) return [];

  const codes: CodeEntry[] = [];

  function dfs(node: HuffmanNode, code: string) {
    if (node.char !== null) {
      codes.push({
        char: node.char,
        freq: node.freq,
        code,
        codeLength: code.length,
      });
      return;
    }
    if (node.left) dfs(node.left, code + '0');
    if (node.right) dfs(node.right, code + '1');
  }

  if (root.char !== null) {
    codes.push({
      char: root.char,
      freq: root.freq,
      code: '0',
      codeLength: 1,
    });
  } else {
    dfs(root, '');
  }

  return codes.sort((a, b) => a.freq - b.freq);
}

export function calculateCompression(codes: CodeEntry[], totalChars: number): CompressionResult {
  const originalBits = totalChars * 8;
  const huffmanBits = codes.reduce((sum, entry) => sum + entry.freq * entry.codeLength, 0);
  const compressionRatio = originalBits > 0 ? ((1 - huffmanBits / originalBits) * 100) : 0;

  return {
    originalBits,
    huffmanBits,
    compressionRatio,
    totalChars,
  };
}

export function layoutTree(root: HuffmanNode | null, canvasWidth: number, canvasHeight: number): TreeNodeLayout[] {
  if (!root) return [];

  const layouts: TreeNodeLayout[] = [];
  const padding = 40;

  function countLeaves(node: HuffmanNode): number {
    if (!node.left && !node.right) return 1;
    return (node.left ? countLeaves(node.left) : 0) + (node.right ? countLeaves(node.right) : 0);
  }

  const leafCount = countLeaves(root);
  const availableWidth = canvasWidth - padding * 2;
  const availableHeight = canvasHeight - padding * 2;

  function getDepth(node: HuffmanNode): number {
    if (!node.left && !node.right) return 0;
    return 1 + Math.max(node.left ? getDepth(node.left) : 0, node.right ? getDepth(node.right) : 0);
  }

  const treeDepth = getDepth(root);
  const levelHeight = treeDepth > 0 ? availableHeight / treeDepth : 0;

  let leafIndex = 0;

  function assignPositions(node: HuffmanNode, depth: number) {
    const y = padding + depth * levelHeight;

    if (!node.left && !node.right) {
      const x = padding + (leafIndex + 0.5) * (availableWidth / leafCount);
      leafIndex++;
      layouts.push({ node, x, y });
      return;
    }

    if (node.left) assignPositions(node.left, depth + 1);
    if (node.right) assignPositions(node.right, depth + 1);

    const childLayouts = layouts.filter(l =>
      l.node.id === node.left?.id || l.node.id === node.right?.id
    );

    let x: number;
    if (childLayouts.length === 2) {
      x = (childLayouts[0].x + childLayouts[1].x) / 2;
    } else if (childLayouts.length === 1) {
      x = childLayouts[0].x;
    } else {
      x = canvasWidth / 2;
    }

    layouts.push({ node, x, y });
  }

  assignPositions(root, 0);
  return layouts;
}

export function exportCodesAsJSON(codes: CodeEntry[]): string {
  const data = codes.map(entry => ({
    character: entry.char === ' ' ? '(space)' : entry.char,
    frequency: entry.freq,
    huffmanCode: entry.code,
    codeLength: entry.codeLength,
  }));
  return JSON.stringify(data, null, 2);
}
