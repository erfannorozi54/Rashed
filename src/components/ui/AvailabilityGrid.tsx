"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const HOURS_START = 7;
const HOURS_END = 22;
const CELLS_PER_DAY = (HOURS_END - HOURS_START) * 2;

export interface Slot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

function cellToTime(cell: number): string {
  const totalMin = HOURS_START * 60 + cell * 30;
  return `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
}

export function slotsToGrid(slots: Slot[]): boolean[][] {
  const grid = emptyGrid();
  for (const s of slots) {
    const [sh, sm] = s.startTime.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);
    const startCell = Math.max(0, Math.floor((sh * 60 + sm - HOURS_START * 60) / 30));
    const endCell = Math.min(CELLS_PER_DAY, Math.floor((eh * 60 + em - HOURS_START * 60) / 30));
    for (let c = startCell; c < endCell; c++) grid[s.dayOfWeek][c] = true;
  }
  return grid;
}

export function gridToSlots(grid: boolean[][]): Slot[] {
  const slots: Slot[] = [];
  for (let day = 0; day < 7; day++) {
    let start: number | null = null;
    for (let c = 0; c <= CELLS_PER_DAY; c++) {
      const active = c < CELLS_PER_DAY && grid[day][c];
      if (active && start === null) start = c;
      if (!active && start !== null) {
        slots.push({ dayOfWeek: day, startTime: cellToTime(start), endTime: cellToTime(c) });
        start = null;
      }
    }
  }
  return slots;
}

export function emptyGrid(): boolean[][] {
  return Array.from({ length: 7 }, () => Array(CELLS_PER_DAY).fill(false));
}

export function cloneGrid(g: boolean[][]): boolean[][] {
  return g.map((row) => [...row]);
}

const HOUR_LABELS = Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, i) => HOURS_START + i);

interface Props {
  grid: boolean[][];
  onChange: (grid: boolean[][]) => void;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
  className?: string;
}

export default function AvailabilityGrid({ grid, onChange, selectedDay, onSelectDay, className }: Props) {
  const [dragging, setDragging] = useState(false);
  const paintRef = useRef(false);
  const lastCellRef = useRef<{ day: number; cell: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const getCellFromPoint = useCallback((x: number, y: number) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const d = el.getAttribute("data-day");
    const c = el.getAttribute("data-cell");
    if (d === null || c === null) return null;
    return { day: Number(d), cell: Number(c) };
  }, []);

  const handlePointerDown = useCallback((day: number, cell: number) => {
    paintRef.current = !grid[day][cell];
    lastCellRef.current = { day, cell };
    setDragging(true);
    const next = cloneGrid(grid);
    next[day][cell] = paintRef.current;
    onChange(next);
  }, [grid, onChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const target = getCellFromPoint(e.clientX, e.clientY);
    if (!target) return;
    if (lastCellRef.current?.day === target.day && lastCellRef.current?.cell === target.cell) return;
    lastCellRef.current = target;
    if (grid[target.day][target.cell] !== paintRef.current) {
      const next = cloneGrid(grid);
      next[target.day][target.cell] = paintRef.current;
      onChange(next);
    }
  }, [dragging, grid, onChange, getCellFromPoint]);

  useEffect(() => {
    if (!dragging) return;
    const up = () => { setDragging(false); lastCellRef.current = null; };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, [dragging]);

  const visibleDays = mobile ? [selectedDay ?? 0] : [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mobile day tabs */}
      {mobile && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
          {DAY_NAMES.map((name, i) => {
            const hasSlots = grid[i].some(Boolean);
            return (
              <button
                key={i}
                onClick={() => onSelectDay(i)}
                className={cn(
                  "shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all relative",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)]",
                  (selectedDay ?? 0) === i
                    ? "bg-[var(--primary-600)] text-white shadow-md"
                    : "bg-white border border-[var(--border)] hover:bg-[var(--muted)]"
                )}
              >
                {name}
                {hasSlots && (
                  <span className={cn(
                    "absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full border-2 border-white",
                    (selectedDay ?? 0) === i ? "bg-emerald-300" : "bg-emerald-500"
                  )} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white shadow-sm">
        <div
          ref={gridRef}
          className="min-w-[640px] select-none"
          style={{ touchAction: "none" }}
          onPointerMove={handlePointerMove}
        >
          {/* Hour labels */}
          <div className="flex border-b border-[var(--border)]">
            <div className="w-20 shrink-0" />
            <div className="flex-1 flex">
              {HOUR_LABELS.map((h, i) => (
                <div
                  key={h}
                  className="text-[10px] text-[var(--muted-foreground)] text-center py-1.5"
                  style={{ width: i < HOUR_LABELS.length - 1 ? `${100 / (HOURS_END - HOURS_START)}%` : 0 }}
                >
                  {h}
                </div>
              ))}
            </div>
          </div>

          {/* Day rows */}
          {visibleDays.map((day) => (
            <div
              key={day}
              className={cn(
                "flex items-center border-t border-[var(--border)] first:border-t-0",
                !mobile && selectedDay === day && "bg-[var(--primary-50)]"
              )}
            >
              {!mobile && (
                <button
                  onClick={() => onSelectDay(selectedDay === day ? null : day)}
                  className={cn(
                    "w-20 shrink-0 py-3 px-2 text-xs font-medium text-right transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary-600)]",
                    selectedDay === day ? "text-[var(--primary-600)]" : "text-[var(--foreground)] hover:text-[var(--primary-600)]"
                  )}
                >
                  {DAY_NAMES[day]}
                </button>
              )}
              {mobile && <div className="w-2 shrink-0" />}
              <div className={cn("flex-1 flex", mobile ? "h-14" : "h-10")}>
                {Array.from({ length: CELLS_PER_DAY }, (_, c) => (
                  <div
                    key={c}
                    data-day={day}
                    data-cell={c}
                    onPointerDown={(e) => { e.preventDefault(); handlePointerDown(day, c); }}
                    className={cn(
                      "h-full transition-colors duration-75 cursor-pointer",
                      grid[day][c] ? "bg-emerald-400 hover:bg-emerald-500" : "bg-gray-50 hover:bg-gray-100",
                      c % 2 === 0 ? "border-l border-[var(--border)]/60" : "border-l border-[var(--border)]/20"
                    )}
                    style={{ width: `${100 / CELLS_PER_DAY}%` }}
                    title={`${cellToTime(c)} – ${cellToTime(c + 1)}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-400 border border-emerald-500" />
          آزاد
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-50 border border-[var(--border)]" />
          غیرفعال
        </span>
      </div>
    </div>
  );
}
