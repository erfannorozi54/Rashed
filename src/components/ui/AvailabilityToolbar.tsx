"use client";

import { useState } from "react";
import { Undo2, Redo2, Copy, ChevronDown, Save, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { cloneGrid } from "@/components/ui/AvailabilityGrid";

const DAY_NAMES = ["شنبه", "یکشنبه", "دوشنبه", "سهشنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const CELLS_PER_DAY = (22 - 7) * 2;

const PRESETS = [
  { label: "صبح", sublabel: "۷–۱۲", from: 0, to: 10, color: "text-orange-600 bg-orange-50 hover:bg-orange-100" },
  { label: "بعدازظهر", sublabel: "۱۲–۱۷", from: 10, to: 20, color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
  { label: "تمام روز", sublabel: "۷–۲۲", from: 0, to: 30, color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" },
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
  grid, selectedDay, history, historyIdx,
  onGridChange, onUndo, onRedo, onSave, saving, className,
}: Props) {
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [copySource, setCopySource] = useState<number | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);

  const close = () => { setPresetsOpen(false); setCopyMenuOpen(false); };

  const applyPreset = (from: number, to: number) => {
    const next = cloneGrid(grid);
    const days = selectedDay !== null ? [selectedDay] : [0, 1, 2, 3, 4, 5, 6];
    for (const d of days)
      for (let c = 0; c < CELLS_PER_DAY; c++) next[d][c] = c >= from && c < to;
    onGridChange(next, true);
    close();
  };

  const clearDay = () => {
    const next = cloneGrid(grid);
    const days = selectedDay !== null ? [selectedDay] : [0, 1, 2, 3, 4, 5, 6];
    for (const d of days) next[d] = Array(CELLS_PER_DAY).fill(false);
    onGridChange(next, true);
    close();
  };

  const copyDay = (targetDay: number) => {
    if (copySource === null) return;
    const next = cloneGrid(grid);
    next[targetDay] = [...grid[copySource]];
    onGridChange(next, true);
    setCopyMenuOpen(false);
    setCopySource(null);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>

      {/* Presets */}
      <div className="relative">
        <Button
          variant="outline" size="sm"
          onClick={() => { setPresetsOpen((o) => !o); setCopyMenuOpen(false); }}
          className={cn("gap-1.5 border-dashed", presetsOpen && "border-[var(--primary-600)] text-[var(--primary-600)]")}
        >
          <Sparkles className="h-3.5 w-3.5" />
          پیش‌تنظیم
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", presetsOpen && "rotate-180")} />
        </Button>
        {presetsOpen && (
          <div className="absolute top-full mt-2 right-0 z-30 bg-white border border-[var(--border)] rounded-xl shadow-xl p-3 min-w-[200px]">
            <p className="text-[11px] font-medium text-[var(--muted-foreground)] mb-2 px-1">
              {selectedDay !== null ? `اعمال روی ${DAY_NAMES[selectedDay]}` : "اعمال روی همه روزها"}
            </p>
            <div className="space-y-1">
              {PRESETS.map((p) => (
                <button key={p.label} onClick={() => applyPreset(p.from, p.to)}
                  className={cn("w-full text-right px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between", p.color)}
                >
                  <span className="font-medium">{p.label}</span>
                  <span className="text-xs opacity-70">{p.sublabel}</span>
                </button>
              ))}
              <div className="border-t border-[var(--border)] mt-1 pt-1">
                <button onClick={clearDay}
                  className="w-full text-right px-3 py-2 text-sm rounded-lg text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <X className="h-3.5 w-3.5" />
                  پاک کردن
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Copy day */}
      <div className="relative">
        <Button
          variant="outline" size="sm"
          onClick={() => { setCopyMenuOpen((o) => !o); setPresetsOpen(false); }}
          className={cn("gap-1.5", copyMenuOpen && "border-[var(--primary-600)] text-[var(--primary-600)]")}
        >
          <Copy className="h-3.5 w-3.5" />
          کپی روز
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", copyMenuOpen && "rotate-180")} />
        </Button>
        {copyMenuOpen && (
          <div className="absolute top-full mt-2 right-0 z-30 bg-white border border-[var(--border)] rounded-xl shadow-xl p-3 min-w-[180px]">
            {copySource === null ? (
              <>
                <p className="text-[11px] font-medium text-[var(--muted-foreground)] mb-2 px-1">انتخاب روز مبدأ:</p>
                {DAY_NAMES.map((name, i) => (
                  <button key={i} onClick={() => setCopySource(i)}
                    className="w-full text-right px-3 py-1.5 text-sm rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >{name}</button>
                ))}
              </>
            ) : (
              <>
                <p className="text-[11px] font-medium text-[var(--muted-foreground)] mb-2 px-1">
                  کپی از <span className="text-[var(--primary-600)]">{DAY_NAMES[copySource]}</span> به:
                </p>
                {DAY_NAMES.map((name, i) => i === copySource ? null : (
                  <button key={i} onClick={() => copyDay(i)}
                    className="w-full text-right px-3 py-1.5 text-sm rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >{name}</button>
                ))}
                <button onClick={() => setCopySource(null)}
                  className="w-full text-right px-3 py-1.5 text-xs text-[var(--muted-foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors mt-1 border-t border-[var(--border)] pt-2"
                >انصراف</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-[var(--border)]" />

      {/* Undo / Redo */}
      <div className="flex gap-1">
        <Button variant="outline" size="icon" onClick={onUndo} disabled={historyIdx <= 0} title="واگرد" className="h-8 w-8">
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" onClick={onRedo} disabled={historyIdx >= history.length - 1} title="تکرار" className="h-8 w-8">
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1" />

      {/* Save */}
      <Button onClick={onSave} disabled={saving} size="sm" className="gap-1.5 shadow-sm">
        <Save className="h-4 w-4" />
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </Button>
    </div>
  );
}
