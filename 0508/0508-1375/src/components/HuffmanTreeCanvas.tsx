import { useRef, useEffect, useCallback } from 'react';
import { useHuffmanStore } from '@/hooks/useHuffmanStore';
import { layoutTree, TreeNodeLayout, HuffmanNode, BuildStep } from '@/utils/huffman';

function collectAllNodeIds(node: HuffmanNode): Set<string> {
  const ids = new Set<string>();
  function walk(n: HuffmanNode) {
    ids.add(n.id);
    if (n.left) walk(n.left);
    if (n.right) walk(n.right);
  }
  walk(node);
  return ids;
}

function drawTreeOnCanvas(
  canvas: HTMLCanvasElement,
  step: BuildStep | null,
  root: HuffmanNode | null,
  highlightedIds: Set<string>
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);

  if (step && step.forest.length > 0) {
    drawForest(ctx, step, rect.width, rect.height, highlightedIds);
  } else if (root) {
    const layouts = layoutTree(root, rect.width, rect.height);
    drawLayouts(ctx, layouts, root, new Set());
  }
}

function drawForest(
  ctx: CanvasRenderingContext2D,
  step: BuildStep,
  width: number,
  height: number,
  highlightedIds: Set<string>
) {
  const forest = step.forest;
  const count = forest.length;
  if (count === 0) return;

  const gap = 16;
  const totalGap = gap * (count + 1);
  const subWidth = Math.max(80, (width - totalGap) / count);
  const subHeight = height - 20;

  forest.forEach((node, i) => {
    const offsetX = gap + i * (subWidth + gap);
    const layouts = layoutTree(node, subWidth, subHeight);

    const adjustedLayouts = layouts.map(l => ({
      ...l,
      x: l.x + offsetX,
      y: l.y + 10,
    }));

    const nodeIds = collectAllNodeIds(node);
    const relevantHighlighted = new Set<string>();
    highlightedIds.forEach(id => {
      if (nodeIds.has(id)) relevantHighlighted.add(id);
    });

    drawLayouts(ctx, adjustedLayouts, node, relevantHighlighted);
  });
}

function drawLayouts(
  ctx: CanvasRenderingContext2D,
  layouts: TreeNodeLayout[],
  root: HuffmanNode,
  highlightedIds: Set<string>
) {
  const nodeMap = new Map(layouts.map(l => [l.node.id, l]));

  function drawNode(node: HuffmanNode) {
    const layout = nodeMap.get(node.id);
    if (!layout) return;

    if (node.left) {
      const leftLayout = nodeMap.get(node.left.id);
      if (leftLayout) {
        ctx.beginPath();
        ctx.moveTo(layout.x, layout.y);
        ctx.lineTo(leftLayout.x, leftLayout.y);
        ctx.strokeStyle = highlightedIds.has(node.id) || highlightedIds.has(node.left.id) ? '#f0a500' : '#334155';
        ctx.lineWidth = highlightedIds.has(node.id) || highlightedIds.has(node.left.id) ? 2 : 1.5;
        ctx.stroke();

        const midX = (layout.x + leftLayout.x) / 2;
        const midY = (layout.y + leftLayout.y) / 2;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('0', midX - 8, midY - 4);
      }
      drawNode(node.left);
    }

    if (node.right) {
      const rightLayout = nodeMap.get(node.right.id);
      if (rightLayout) {
        ctx.beginPath();
        ctx.moveTo(layout.x, layout.y);
        ctx.lineTo(rightLayout.x, rightLayout.y);
        ctx.strokeStyle = highlightedIds.has(node.id) || highlightedIds.has(node.right.id) ? '#f0a500' : '#334155';
        ctx.lineWidth = highlightedIds.has(node.id) || highlightedIds.has(node.right.id) ? 2 : 1.5;
        ctx.stroke();

        const midX = (layout.x + rightLayout.x) / 2;
        const midY = (layout.y + rightLayout.y) / 2;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('1', midX + 8, midY - 4);
      }
      drawNode(node.right);
    }

    const isLeaf = node.char !== null;
    const isHighlighted = highlightedIds.has(node.id);
    const radius = isLeaf ? 22 : 18;

    if (isHighlighted) {
      ctx.beginPath();
      ctx.arc(layout.x, layout.y, radius + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(240, 165, 0, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(240, 165, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(layout.x, layout.y, radius, 0, Math.PI * 2);

    if (isLeaf) {
      const grad = ctx.createRadialGradient(layout.x - 4, layout.y - 4, 2, layout.x, layout.y, radius);
      grad.addColorStop(0, '#00e5a0');
      grad.addColorStop(1, '#009b6e');
      ctx.fillStyle = grad;
    } else if (isHighlighted) {
      const grad = ctx.createRadialGradient(layout.x - 3, layout.y - 3, 2, layout.x, layout.y, radius);
      grad.addColorStop(0, '#2a4a6f');
      grad.addColorStop(1, '#1a2a3f');
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createRadialGradient(layout.x - 3, layout.y - 3, 2, layout.x, layout.y, radius);
      grad.addColorStop(0, '#1e3a5f');
      grad.addColorStop(1, '#0d1b2a');
      ctx.fillStyle = grad;
    }
    ctx.fill();

    ctx.strokeStyle = isHighlighted ? '#f0a500' : (isLeaf ? '#00c9a7' : '#1e3a5f');
    ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
    ctx.stroke();

    if (isLeaf) {
      const displayChar = node.char === ' ' ? '␣' : node.char;
      ctx.font = 'bold 14px JetBrains Mono, monospace';
      ctx.fillStyle = '#0d1b2a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayChar, layout.x, layout.y - 3);

      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = '#0d1b2a';
      ctx.fillText(`${node.freq}`, layout.x, layout.y + 10);
    } else {
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillStyle = isHighlighted ? '#f0a500' : '#e0e0e0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${node.freq}`, layout.x, layout.y);
    }
  }

  drawNode(root);
}

export default function HuffmanTreeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const root = useHuffmanStore(s => s.root);
  const steps = useHuffmanStore(s => s.steps);
  const currentStep = useHuffmanStore(s => s.currentStep);

  const getHighlightedIds = useCallback((): Set<string> => {
    const step = steps[currentStep];
    if (!step || !step.mergedNode) return new Set();
    return collectAllNodeIds(step.mergedNode);
  }, [steps, currentStep]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const step = steps[currentStep] || null;
    const highlightedIds = getHighlightedIds();
    drawTreeOnCanvas(canvas, step, root, highlightedIds);
  }, [root, steps, currentStep, getHighlightedIds]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const step = steps[currentStep] || null;
      const highlightedIds = getHighlightedIds();
      drawTreeOnCanvas(canvas, step, root, highlightedIds);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [root, steps, currentStep, getHighlightedIds]);

  return (
    <div className="w-full h-full min-h-[400px] relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl border border-zinc-800/50 bg-[#060e1a]"
      />
    </div>
  );
}
