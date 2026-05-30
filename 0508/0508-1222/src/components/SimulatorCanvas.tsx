import { useEffect, useRef, useState, useCallback } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { renderCanvas } from '@/utils/rendering/canvasRenderer';
import { calculateVectorFieldGrid } from '@/utils/physics/electricField';
import { generateFieldLines } from '@/utils/physics/fieldLineTracer';
import { findChargeAtPoint } from '@/utils/rendering/chargeRenderer';
import { findConductorAtPoint } from '@/utils/physics/conductorInduction';
import { Vector2D } from '@/types/physics';

export function SimulatorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const animationRef = useRef<number>();
  const vectorFieldRef = useRef<
    { x: number; y: number; Ex: number; Ey: number; magnitude: number }[]
  >([]);
  const fieldLinesRef = useRef<Vector2D[][]>([]);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragTypeRef = useRef<'charge' | 'particle' | 'conductor' | null>(null);
  const dragChargeIdRef = useRef<string | null>(null);
  const dragConductorIdRef = useRef<string | null>(null);

  const {
    charges,
    particles,
    conductors,
    magneticField,
    displayConfig,
    currentTool,
    selectedChargeId,
    selectedConductorId,
    addCharge,
    updateChargePosition,
    addParticle,
    addConductor,
    selectCharge,
    selectConductor,
    selectParticle,
    removeCharge,
    removeConductor,
    updateConductorPosition,
    updateParticles,
  } = useSimulationStore();

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (charges.length > 0) {
      vectorFieldRef.current = calculateVectorFieldGrid(
        dimensions.width,
        dimensions.height,
        displayConfig.vectorGridDensity,
        charges
      );
      fieldLinesRef.current = generateFieldLines(
        charges,
        dimensions.width,
        dimensions.height,
        displayConfig.fieldLineDensity
      );
    } else {
      vectorFieldRef.current = [];
      fieldLinesRef.current = [];
    }
  }, [charges, dimensions, displayConfig.vectorGridDensity, displayConfig.fieldLineDensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      updateParticles();

      renderCanvas(ctx, dimensions.width, dimensions.height, {
        charges,
        particles,
        conductors,
        magneticField,
        displayConfig,
        vectorFieldData: vectorFieldRef.current,
        fieldLines: fieldLinesRef.current,
        selectedConductorId,
      });

      if (dragTypeRef.current === 'particle' && dragStartRef.current) {
        const mouseX = dragStartRef.current.x;
        const mouseY = dragStartRef.current.y;
        ctx.strokeStyle = 'rgba(255, 107, 53, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    charges,
    particles,
    magneticField,
    displayConfig,
    dimensions,
    updateParticles,
  ]);

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const { x, y } = getCanvasCoords(e);
      dragStartRef.current = { x, y };

      const chargeAtPoint = findChargeAtPoint(x, y, charges);
      const conductorAtPoint = findConductorAtPoint(x, y, conductors);

      if (currentTool === 'select') {
        if (chargeAtPoint) {
          isDraggingRef.current = true;
          dragTypeRef.current = 'charge';
          dragChargeIdRef.current = chargeAtPoint.id;
          selectCharge(chargeAtPoint.id);
          selectConductor(null);
        } else if (conductorAtPoint) {
          isDraggingRef.current = true;
          dragTypeRef.current = 'conductor';
          dragConductorIdRef.current = conductorAtPoint.id;
          selectConductor(conductorAtPoint.id);
          selectCharge(null);
        } else {
          const clickedParticle = particles.find(
            (p) => Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2) < 15
          );
          if (clickedParticle) {
            selectParticle(clickedParticle.id);
          } else {
            selectCharge(null);
            selectConductor(null);
            selectParticle(null);
          }
        }
      } else if (currentTool === 'positive' || currentTool === 'negative') {
        if (chargeAtPoint) {
          if (e.shiftKey) {
            removeCharge(chargeAtPoint.id);
          } else {
            isDraggingRef.current = true;
            dragTypeRef.current = 'charge';
            dragChargeIdRef.current = chargeAtPoint.id;
            selectCharge(chargeAtPoint.id);
          }
        } else {
          addCharge(x, y, currentTool === 'positive' ? 'positive' : 'negative');
        }
      } else if (currentTool === 'conductor') {
        if (conductorAtPoint) {
          if (e.shiftKey) {
            removeConductor(conductorAtPoint.id);
          } else {
            isDraggingRef.current = true;
            dragTypeRef.current = 'conductor';
            dragConductorIdRef.current = conductorAtPoint.id;
            selectConductor(conductorAtPoint.id);
          }
        } else {
          addConductor(x, y);
        }
      } else if (currentTool === 'particle') {
        isDraggingRef.current = true;
        dragTypeRef.current = 'particle';
      }
    },
    [
      currentTool,
      charges,
      conductors,
      particles,
      getCanvasCoords,
      addCharge,
      addConductor,
      selectCharge,
      selectConductor,
      selectParticle,
      removeCharge,
      removeConductor,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;

      const { x, y } = getCanvasCoords(e);

      if (dragTypeRef.current === 'charge' && dragChargeIdRef.current) {
        updateChargePosition(dragChargeIdRef.current, x, y);
      } else if (dragTypeRef.current === 'conductor' && dragConductorIdRef.current) {
        updateConductorPosition(dragConductorIdRef.current, x, y);
      } else if (dragTypeRef.current === 'particle' && dragStartRef.current) {
        dragStartRef.current = { x, y };
      }
    },
    [getCanvasCoords, updateChargePosition, updateConductorPosition]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (dragTypeRef.current === 'particle' && dragStartRef.current) {
        const { x, y } = getCanvasCoords(e);
        const dx = x - dragStartRef.current.x;
        const dy = y - dragStartRef.current.y;
        const angle = Math.atan2(dy, dx);

        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          addParticle(dragStartRef.current.x, dragStartRef.current.y, angle);
        } else {
          addParticle(x, y, 0);
        }
      }

      isDraggingRef.current = false;
      dragStartRef.current = null;
      dragTypeRef.current = null;
      dragChargeIdRef.current = null;
      dragConductorIdRef.current = null;
    },
    [getCanvasCoords, addParticle]
  );

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-crosshair"
      />

      {selectedConductorId && (
        <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur rounded-lg px-4 py-2 text-sm">
          <span className="text-slate-400">选中导体: </span>
          <span className="text-blue-400 font-mono">
            半径 {conductors.find((c) => c.id === selectedConductorId)?.radius}px
          </span>
          <span className="text-slate-500 ml-2">(Shift+点击删除)</span>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur rounded-lg px-4 py-2 text-xs text-slate-400">
        <div>正电荷: <span className="text-cyan-400">{charges.filter((c) => c.charge > 0).length}</span></div>
        <div>负电荷: <span className="text-red-400">{charges.filter((c) => c.charge < 0).length}</span></div>
        <div>导体球: <span className="text-blue-400">{conductors.length}</span></div>
        <div>粒子数: <span className="text-orange-400">{particles.length}</span></div>
      </div>
    </div>
  );
}
