"use client";

import { useState } from "react";
import { Undo2, Redo2, Copy, ChevronDown, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { cloneGrid } from "@/components/ui/AvailabilityGrid";

const DAY_NAMES = ["شنبه", "یکشنبه", "دوشنبه", "سهشنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const HOURS_START = 7;
const CELLS_PER_DAY = (22 - HOURS_START) * 2;

const PRESETS: { label: string; from: number; to: number }[] = [
  { label: "صبح", from: 0, to: 10 },       // 7:00–12:00
  { label: "بعدازظهر", from: 10, to: 20 }, // 12:00–17:00
  { label: "تمام روز", from: 0, to: 30 },  // 7:00–22:00
];

interface Props {
  grid: boolean[][];
  selectedDay: number | null;
  history: boolean[][][];
  historyIdx: number;
  onGridChange: (grid: boolean[][], pushHistory?: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  saving: boolean;
  className?: string;
}

export default function AvailabilityToolbar({
  grid,
  selectedDay,
  history,
  historyIdx,
  onGridChange,
  onUndo,
  onRedo,
  onSave,
  saving,
  className,
}: Props) {
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [copySource, setCopySource] = useState<number | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);

  const applyPreset = (from: number, to: number) => {
    const next = cloneGrid(grid);
    const days = selectedDay !== null ? [selectedDay] : [0, 1, 2, 3, 4, 5, 6];
    for (const d of days) {
      for (let c = 0; c < CELLS_PER_DAY; c++) {
        next[d][c] = c >= from && c < to;
      }
    }
    onGridChange(next, true);
    setPresetsOpen(false);
  };

  const copyDay = (targetDay: number) => {
    if (copySource === null) return;
    const next = cloneGrid(grid);
    next[targetDay] = [...grid[copySource]];
    onGridChange(next, true);
    setCopyMenuOpen(false);
    setCopySource(null);
  };

  const clearDay = () => {
    const next = cloneGrid(grid);
    const days = selectedDay !== null ? [selectedDay] : [0, 1, 2, 3, 4, 5, 6];
    for (const d of days) next[d] = Array(CELLS_PER_DAY).fill(false);
    onGridChange(next, true);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Presets */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setPresetsOpen((o) => !o); setCopyMenuOpen(false); }}
          className="gap-1"
        >
          پیش‌تنظیم
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        {presetsOpen && (
          <div className="absolute top-full mt-1 right-0 z-20 bg-white border border-[var(--border)] rounded-lg shadow-lg p-1 min-w-[160px]">
            <p className="text-[11px] text-[var(--muted-foreground)] px-2 py-1">
              {selectedDay !== null ? `اعمال روی ${DAY_NAMES[selectedDay]}` : "اعمال روی همه روزها"}
            </p>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.from, p.to)}
                className="w-full text-right px-3 py-1.5 text-sm rounded hover:bg-[var(--muted)] transition-colors"
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={clearDay}
              className="w-full text-right px-3 py-1.5 text-sm rounded hover:bg-[var(--muted)] text-red-500 transition-colors"
            >
              پاک کردن
            </button>
          </div>
        )}
      </div>

      {/* Copy day */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setCopyMenuOpen((o) => !o); setPresetsOpen(false); }}
          className="gap-1"
        >
          <Copy className="h-3.5 w-3.5" />
          کپی روز
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        {copyMenuOpen && (
          <div className="absolute top-full mt-1 right-0 z-20 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 min-w-[200px]">
            {copySource === null ? (
              <>
                <p className="text-[11px] text-[var(--muted-foreground)] px-1 pb-1">انتخاب روز مبدأ:</p>
                {DAY_NAMES.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => setCopySource(i)}
                    className="w-full text-right px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)] transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </>
            ) : (
              <>
                <p className="text-[11px] text-[var(--muted-foreground)] px-1 pb-1">
                  کپی از {DAY_NAMES[copySource]} به:
                </p>
                {DAY_NAMES.map((name, i) =>
                  i === copySource ? null : (
                    <button
                      key={i}
                      onClick={() => copyDay(i)}
                      className="w-full text-right px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)] transition-colors"
                    >
                      {name}
                    </button>
                  )
                )}
                <button
                  onClick={() => setCopySource(null)}
                  className="w-full text-right px-2 py-1.5 text-xs text-[var(--muted-foreground)] rounded hover:bg-[var(--muted)] transition-colors mt-1 border-t border-[var(--border)]"
                >
                  انصراف
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Undo / Redo */}
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={onUndo}
          disabled={historyIdx <= 0}
          title="واگرد"
          className="h-9 w-9"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onRedo}
          disabled={historyIdx >= history.length - 1}
          title="تکرار"
          className="h-9 w-9"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save */}
      <Button onClick={onSave} disabled={saving} size="sm" className="gap-1.5">
        <Save className="h-4 w-4" />
        {saving ? "در حال ذخیره..." : "ذخیره"}
      </Button>
    </div>
  );
}
