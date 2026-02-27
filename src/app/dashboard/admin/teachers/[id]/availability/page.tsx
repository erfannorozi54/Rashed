"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Clock } from "lucide-react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import AvailabilityGrid, {
  slotsToGrid,
  gridToSlots,
  emptyGrid,
  cloneGrid,
  type Slot,
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

  // Undo/redo history
  const historyRef = useRef<boolean[][][]>([emptyGrid()]);
  const historyIdxRef = useRef(0);
  const [historySnapshot, setHistorySnapshot] = useState({ history: historyRef.current, idx: 0 });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    fetch(`/api/users/${id}`).then((r) => r.json()).then(setTeacher);
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

  // Push to history when grid changes via drag (the grid calls onChange on every cell)
  // We only push on pointer-up; the grid itself doesn't push — toolbar does for presets/copy.
  // For drag, we push after pointer-up by listening to the grid's onChange with a debounce.
  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleGridDrag = useCallback((g: boolean[][]) => {
    setGrid(g);
    if (dragTimerRef.current) clearTimeout(dragTimerRef.current);
    dragTimerRef.current = setTimeout(() => pushHistory(g), 300);
  }, [pushHistory]);

  const saveSlots = async () => {
    setSaving(true);
    const slots = gridToSlots(grid);
    const res = await fetch(`/api/teachers/${id}/availability`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots }),
    });
    setSaving(false);
    if (res.ok) showToast("زمان‌های آزاد ذخیره شد ✓");
  };

  const addException = async (ex: { date: string; startTime: string | null; endTime: string | null; type: "BLOCKED" | "BUSY" }) => {
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

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      <DashboardHeader title={`مدیریت زمان آزاد${teacher ? ` — ${teacher.name}` : ""}`} />

      <main className="container mx-auto px-4 py-6 space-y-4 max-w-5xl">
        {/* Grid card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              زمان‌های آزاد هفتگی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        {/* Exceptions */}
        <ExceptionsCard
          exceptions={exceptions}
          onAdd={addException}
          onDelete={deleteException}
        />
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--primary-600)] text-white text-sm px-5 py-2.5 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}
