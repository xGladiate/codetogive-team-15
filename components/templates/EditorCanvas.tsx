"use client";
import { useMemo, useState } from "react";
import { Rnd } from "react-rnd";

export type Layer =
  | {
      id: string;
      type: "image";
      src: string;
      x: number; y: number;
      width: number; height: number;
    }
  | {
      id: string;
      type: "text";
      text: string;
      x: number; y: number;
      width: number; height: number;
      fontSize?: number;
      fontWeight?: 400 | 600 | 700 | 800;
      align?: "left" | "center" | "right";
      color?: string; // NEW
    };

type Props = {
  width: number;
  height: number;
  background?: React.ReactNode;
  layers: Layer[];
  setLayers: (updater: (prev: Layer[]) => Layer[]) => void;
  selectedId?: string | null;
  setSelectedId?: (id: string | null) => void;
  editable?: boolean;
  onEditText?: (layer: Extract<Layer,{type:"text"}>) => void;
  onDeleteSelected?: () => void;
};

export default function EditorCanvas({
  width, height, background,
  layers, setLayers,
  selectedId, setSelectedId,
  editable = true,
  onEditText, onDeleteSelected,
}: Props) {
  const ordered = useMemo(() => layers, [layers]);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const select = (id: string | null) => setSelectedId?.(id);
  const update = (id: string, patch: Partial<Layer>) =>
    setLayers(prev => prev.map(l => (l.id === id ? ({ ...l, ...patch } as Layer) : l)));

  return (
    <div
      className="relative mx-auto rounded-3xl overflow-hidden bg-white border shadow"
      style={{ width, height }}
      onMouseDown={() => editable && select(null)}
    >
      <div className="absolute inset-0 pointer-events-none">{background}</div>

      {ordered.map(layer => {
        const isSel = selectedId === layer.id;

        const common = {
          bounds: "parent" as const,
          size: { width: layer.width, height: layer.height },
          position: { x: layer.x, y: layer.y },
          enableResizing: editable,
          disableDragging: !editable,
          onDragStop: (_e: any, d: { x: number; y: number }) => update(layer.id, { x: d.x, y: d.y }),
          onResizeStop: (_e: any, _dir: any, ref: HTMLElement, _delta: any, pos: { x: number; y: number }) =>
            update(layer.id, { width: ref.offsetWidth, height: ref.offsetHeight, x: pos.x, y: pos.y }),
          onMouseDown: (e: any) => { e.stopPropagation(); editable && select(layer.id); },
          onMouseEnter: () => setHoverId(layer.id),
          onMouseLeave: () => setHoverId(h => (h === layer.id ? null : h)),
          style: { border: editable && isSel ? "2px solid #3b82f6" : "none", background: "transparent" },
          className: "rounded-md bg-transparent",
        };

        if (layer.type === "image") {
          return (
            <Rnd key={layer.id} {...common}>
              <div className="relative w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={layer.src}
                  alt=""
                  className="w-full h-full object-cover select-none"
                  draggable={false}
                  crossOrigin="anonymous"  // helps html-to-image
                />
                {editable && (isSel || hoverId === layer.id) && onDeleteSelected && (
                  <button
                    onClick={(e) => { e.stopPropagation(); select(layer.id); onDeleteSelected(); }}
                    title="Delete"
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border shadow flex items-center justify-center"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 6h18" strokeWidth="2" />
                      <path d="M8 6V4h8v2" strokeWidth="2" />
                      <path d="M19 6l-1 14H6L5 6" strokeWidth="2" />
                    </svg>
                  </button>
                )}
              </div>
            </Rnd>
          );
        }

        return (
          <Rnd key={layer.id} {...common}>
            <div
              className="relative w-full h-full p-2 select-none"
              onDoubleClick={(e) => { e.stopPropagation(); editable && onEditText?.(layer); }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  layer.align === "center" ? "center" : layer.align === "right" ? "flex-end" : "flex-start",
                fontSize: layer.fontSize ?? 28,
                fontWeight: layer.fontWeight ?? 700,
                textAlign: layer.align ?? "left",
                color: layer.color ?? "#111827", // NEW default gray-900
                whiteSpace: "pre-wrap",
                lineHeight: 1.25,
              }}
            >
              {layer.text}

              {editable && (isSel || hoverId === layer.id) && onDeleteSelected && (
                <button
                  onClick={(e) => { e.stopPropagation(); select(layer.id); onDeleteSelected(); }}
                  title="Delete"
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border shadow flex items-center justify-center"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 6h18" strokeWidth="2" />
                    <path d="M8 6V4h8v2" strokeWidth="2" />
                    <path d="M19 6l-1 14H6L5 6" strokeWidth="2" />
                  </svg>
                </button>
              )}
            </div>
          </Rnd>
        );
      })}
    </div>
  );
}
