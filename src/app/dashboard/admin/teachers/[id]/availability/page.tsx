"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { Clock, CalendarDays } from "lucide-react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import AvailabilityGrid, {
  slotsToGrid,
  gridToSlots,
  emptyGrid,
  cloneGrid,
} from "@/components/ui/AvailabilityGrid";
import AvailabilityToolbar from "@/components/ui/AvailabilityToolbar";
import ExceptionsCard, { type Exception } from "@/components/ui/ExceptionsCard";

export default function AdminTeacherAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [teacher, setTeacher] = useState<{ name: string } | null>(null);
  const [grid, setGrid] = useState<boolean[][]>(emptyGrid());
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const historyRef = useRef<boolean[][][]>([emptyGrid()]);
  const historyIdxRef = useRef(0);
  const [historySnapshot, setHistorySnapshot] = useState({ history: historyRef.current, idx: 0 });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    fetch(`/api/users/${id}`).then((r) => r.json()).then((d) => setTeacher(d.user ?? d));
    fetch(`/api/teachers/${id}/availability`).then((r) => r.json()).then((d) => {
      const g = slotsToGrid(d.slots || []);
      setGrid(g);
      historyRef.current = [cloneGrid(g)];
      historyIdxRef.current = 0;
      setHistorySnapshot({ history: historyRef.current, idx: 0 });
      setExceptions(d.exceptions || []);
    });
  }, [id]);

  const pushHistory = useCallback((g: boolean[][]) => {
    const h = historyRef.current.slice(0, historyIdxRef.current + 1);
    h.push(cloneGrid(g));
    historyRef.current = h;
    historyIdxRef.current = h.length - 1;
    setHistorySnapshot({ history: h, idx: historyIdxRef.current });
  }, []);

  const handleGridChange = useCallback((g: boolean[][], push = false) => {
    setGrid(g);
    if (push) pushHistory(g);
  }, [pushHistory]);

  const handleUndo = () => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    const g = cloneGrid(historyRef.current[historyIdxRef.current]);
    setGrid(g);
    setHistorySnapshot({ history: historyRef.current, idx: historyIdxRef.current });
  };

  const handleRedo = () => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    const g = cloneGrid(historyRef.current[historyIdxRef.current]);
    setGrid(g);
    setHistorySnapshot({ history: historyRef.current, idx: historyIdxRef.current });
  };

  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleGridDrag = useCallback((g: boolean[][]) => {
    setGrid(g);
    if (dragTimerRef.current) clearTimeout(dragTimerRef.current);
    dragTimerRef.current = setTimeout(() => pushHistory(g), 300);
  }, [pushHistory]);

  const saveSlots = async () => {
    setSaving(true);
    const res = await fetch(`/api/teachers/${id}/availability`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: gridToSlots(grid) }),
    });
    setSaving(false);
    if (res.ok) showToast("زمان‌های آزاد با موفقیت ذخیره شد ✓");
  };

  const addException = async (ex: { date: string; startTime: string | null; endTime: string | null; type: "BLOCKED" }) => {
    const res = await fetch(`/api/teachers/${id}/availability/exceptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ex),
    });
    if (res.ok) {
      const data = await res.json();
      setExceptions((prev) => [...prev, data.exception]);
    }
  };

  const deleteException = async (exId: string) => {
    await fetch(`/api/teachers/${id}/availability/exceptions/${exId}`, { method: "DELETE" });
    setExceptions((prev) => prev.filter((e) => e.id !== exId));
  };

  // Stats
  const totalFreeCells = grid.flat().filter(Boolean).length;
  const totalFreeHours = (totalFreeCells * 30) / 60;
  const activeDays = grid.filter((row) => row.some(Boolean)).length;

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      <DashboardHeader title={`مدیریت زمان آزاد${teacher ? ` — ${teacher.name}` : ""}`} />

      <main className="container mx-auto px-4 py-6 space-y-5 max-w-5xl">

        {/* Stats strip */}
        {totalFreeCells > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-[var(--border)] px-4 py-3 flex items-center gap-3 shadow-sm">
              <span className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-emerald-600" />
              </span>
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">ساعت آزاد در هفته</p>
                <p className="text-lg font-bold text-emerald-600">{totalFreeHours}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[var(--border)] px-4 py-3 flex items-center gap-3 shadow-sm">
              <span className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <CalendarDays className="h-4 w-4 text-blue-600" />
              </span>
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">روز فعال در هفته</p>
                <p className="text-lg font-bold text-blue-600">{activeDays}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[var(--border)] px-4 py-3 flex items-center gap-3 shadow-sm col-span-2 sm:col-span-1">
              <span className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <CalendarDays className="h-4 w-4 text-red-500" />
              </span>
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">استثناهای ثبت‌شده</p>
                <p className="text-lg font-bold text-red-500">{exceptions.filter(e => e.type === "BLOCKED").length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Grid card */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-5 py-4 border-b border-[var(--border)] bg-gradient-to-l from-emerald-50 to-white flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-emerald-600" />
            </span>
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">زمان‌های آزاد هفتگی</h2>
              <p className="text-xs text-[var(--muted-foreground)]">روی سلول‌ها کلیک کنید یا بکشید تا زمان آزاد تعریف کنید</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <AvailabilityToolbar
              grid={grid}
              selectedDay={selectedDay}
              history={historySnapshot.history}
              historyIdx={historySnapshot.idx}
              onGridChange={handleGridChange}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onSave={saveSlots}
              saving={saving}
            />
            <AvailabilityGrid
              grid={grid}
              onChange={handleGridDrag}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          </div>
        </div>

        {/* Exceptions */}
        <ExceptionsCard
          exceptions={exceptions}
          onAdd={addException}
          onDelete={deleteException}
        />
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-sm px-6 py-3 rounded-full shadow-xl flex items-center gap-2">
          {toast}
        </div>
      )}
    </div>
  );
}
