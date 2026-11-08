'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Activity,
} from 'lucide-react';

interface FunctionItem {
  id: string;
  expr: string;
  color: string;
  visible: boolean;
}

const PALETTE = ['#358eb8', '#d49b35', '#2d9d78', '#c85a32', '#7c6bb0', '#d15679'];

interface CoordinateGrapherProps {
  initialFunctions?: string[];
}

export const CoordinateGrapher: React.FC<CoordinateGrapherProps> = ({
  initialFunctions = ['x^2 - 4', '2*x + 1'],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [functions, setFunctions] = useState<FunctionItem[]>(() =>
    initialFunctions.map((expr, idx) => ({
      id: `fn-${idx}`,
      expr,
      color: PALETTE[idx % PALETTE.length],
      visible: true,
    }))
  );
  const [newExpr, setNewExpr] = useState('');
  const [useGeoGebra, setUseGeoGebra] = useState(false);

  // View bounds
  const [scale, setScale] = useState(40); // pixels per unit
  const [origin, setOrigin] = useState({ x: 0, y: 0 }); // offset from center
  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Safe mathematical expression evaluator
  const evaluateExpr = useCallback((expr: string, xVal: number): number => {
    try {
      // 1. Insert explicit multiplication for implicit syntax
      // e.g. 4x -> 4*x, 4( -> 4*(, )x -> )*x, )( -> )*(
      let sanitized = expr
        .replace(/(\d+)\s*([a-zA-Z(])/g, '$1*$2')
        .replace(/\)\s*(\d+|[a-zA-Z(])/g, ')*$1')
        .replace(/\b([a-zA-Z]+)\s*\(/g, (match, fnName) => {
          if (fnName === 'x') return 'x*(';
          return match;
        });

      // 2. Replace algebraic syntax with JS Math functions
      sanitized = sanitized
        .replace(/\^/g, '**')
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\btan\b/g, 'Math.tan')
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\bexp\b/g, 'Math.exp')
        .replace(/\blog\b/g, 'Math.log')
        .replace(/\bln\b/g, 'Math.log')
        .replace(/\babs\b/g, 'Math.abs')
        .replace(/\bpi\b/gi, 'Math.PI')
        .replace(/\be\b/gi, 'Math.E');

      // Evaluator with x in scope
      const fn = new Function('x', `"use strict"; return (${sanitized});`);
      const y = fn(xVal);
      return typeof y === 'number' && !isNaN(y) ? y : NaN;
    } catch {
      return NaN;
    }
  }, []);

  // Canvas Drawing Loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2 + origin.x;
    const centerY = height / 2 + origin.y;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Draw Gridlines
    const step = scale; // 1 unit
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#e2e8f0'; // light grid
    if (document.documentElement.classList.contains('dark')) {
      ctx.strokeStyle = '#1e293b'; // dark grid
    }

    // Vertical gridlines
    for (let x = centerX % step; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal gridlines
    for (let y = centerY % step; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Axes (X and Y)
    ctx.lineWidth = 2;
    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#64748b' : '#94a3b8';

    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Draw Axis Numbers & Ticks
    ctx.font = '10px sans-serif';
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b';

    for (let x = centerX % step; x < width; x += step) {
      const unitVal = Math.round((x - centerX) / scale);
      if (unitVal !== 0) {
        ctx.fillText(unitVal.toString(), x - 6, centerY + 14);
      }
    }

    for (let y = centerY % step; y < height; y += step) {
      const unitVal = Math.round((centerY - y) / scale);
      if (unitVal !== 0) {
        ctx.fillText(unitVal.toString(), centerX + 6, y + 4);
      }
    }

    // Draw origin (0,0)
    ctx.fillText('0', centerX - 10, centerY + 14);

    // Draw Functions
    functions.forEach((fn) => {
      if (!fn.visible || !fn.expr.trim()) return;

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = fn.color;
      ctx.beginPath();

      let isDrawing = false;

      for (let px = 0; px < width; px += 2) {
        const mathX = (px - centerX) / scale;
        const mathY = evaluateExpr(fn.expr, mathX);

        if (!isNaN(mathY) && Math.abs(mathY) < 1000) {
          const py = centerY - mathY * scale;

          if (!isDrawing) {
            ctx.moveTo(px, py);
            isDrawing = true;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          isDrawing = false;
        }
      }
      ctx.stroke();
    });
  }, [origin, scale, functions, evaluateExpr]);

  // Resize canvas to match display size
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.clientWidth;
        canvasRef.current.height = canvasRef.current.clientHeight;
        draw();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleZoom = useCallback((factor: number) => {
    setScale((prev) => Math.max(10, Math.min(200, prev * factor)));
  }, []);

  // Mouse wheel zoom listener (attached non-passively to prevent page scroll)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      handleZoom(zoomFactor);
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [handleZoom]);

  // Unified Pointer pan controls (handles mouse, touch, and stylus)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const centerX = canvas.width / 2 + origin.x;
    const centerY = canvas.height / 2 + origin.y;

    const mathX = Math.round(((px - centerX) / scale) * 100) / 100;
    const mathY = Math.round(((centerY - py) / scale) * 100) / 100;
    setMouseCoord({ x: mathX, y: mathY });

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      setOrigin((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    const target = e.target as HTMLElement;
    if (target.hasPointerCapture?.(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
  };

  const resetView = () => {
    setScale(40);
    setOrigin({ x: 0, y: 0 });
  };

  const addFunction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpr.trim()) return;
    setFunctions((prev) => [
      ...prev,
      {
        id: `fn-${Date.now()}`,
        expr: newExpr.trim(),
        color: PALETTE[prev.length % PALETTE.length],
        visible: true,
      },
    ]);
    setNewExpr('');
  };

  const removeFunction = (id: string) => {
    setFunctions((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-dark-card p-3 rounded-lg border border-gray-200 dark:border-dark-border shadow-2xs">
        {/* Function input bar */}
        <form onSubmit={addFunction} className="flex-1 flex items-center space-x-2 min-w-[280px]">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2 text-xs font-serif italic font-semibold text-brand-600 dark:text-brand-400">
              f(x) =
            </span>
            <input
              type="text"
              value={newExpr}
              onChange={(e) => setNewExpr(e.target.value)}
              placeholder="e.g. x^2 - 4x + 3, sin(x), 2*x"
              aria-label="Mathematical function to plot"
              className="w-full pl-14 pr-3 py-1.5 text-sm font-mono bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Plot</span>
          </button>
        </form>

        {/* View Controls & Embed Toggle */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => handleZoom(1.25)}
            className="p-1.5 rounded-md border border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-surface text-gray-600 dark:text-dark-muted"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="p-1.5 rounded-md border border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-surface text-gray-600 dark:text-dark-muted"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-md border border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-surface text-gray-600 dark:text-dark-muted"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setUseGeoGebra(!useGeoGebra)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              useGeoGebra
                ? 'bg-brand-50 text-brand-700 border-brand-300 dark:bg-brand-950/40 dark:text-brand-300'
                : 'border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-muted'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{useGeoGebra ? 'GeoGebra Active' : 'GeoGebra Mode'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas / GeoGebra area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-[500px]">
        {/* Graph Display */}
        <div className="flex-1 relative rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden bg-white dark:bg-dark-card shadow-2xs min-h-[400px]">
          {useGeoGebra ? (
            <iframe
              src="https://www.geogebra.org/calculator"
              title="GeoGebra Graphing Calculator"
              className="w-full h-full border-0 min-h-[500px]"
              allow="camera; microphone"
            />
          ) : (
            <>
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full h-full cursor-crosshair touch-none"
              />
              {/* Live Coordinates Pill */}
              {mouseCoord && (
                <div className="absolute bottom-3 right-3 bg-dark-bg/90 border border-dark-border text-white px-2.5 py-1 rounded text-xs font-mono">
                  ({mouseCoord.x}, {mouseCoord.y})
                </div>
              )}
            </>
          )}
        </div>

        {/* Functions sidebar */}
        <div className="w-full lg:w-72 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-dark-border/80">
            <span className="font-serif text-sm font-semibold text-gray-800 dark:text-gray-200">
              Plotted Functions ({functions.length})
            </span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-dark-border border border-gray-200/80 dark:border-dark-border rounded-md max-h-[400px] overflow-y-auto">
            {functions.map((fn, idx) => (
              <div
                key={fn.id}
                className="flex items-center justify-between p-2.5 bg-gray-50/40 dark:bg-dark-surface/30"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: fn.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-medium text-gray-900 dark:text-white truncate">
                      f_{idx + 1}(x) = {fn.expr}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFunction(fn.id)}
                  className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-900/40 text-xs text-brand-800 dark:text-brand-300">
            <p className="font-semibold flex items-center mb-1">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Plotting Tips
            </p>
            <p className="text-[11px] leading-relaxed">
              Drag to pan the coordinate plane. Use mousewheel or zoom buttons to scale. Standard functions supported: <code className="font-mono">sin</code>, <code className="font-mono">cos</code>, <code className="font-mono">sqrt</code>, <code className="font-mono">exp</code>, <code className="font-mono">x^2</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
