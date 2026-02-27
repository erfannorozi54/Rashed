"use client";

import { useState } from "react";
import { Trash2, CalendarOff, Ban, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import { toJalali } from "@/lib/jalali-utils";
import { cn } from "@/lib/utils";

export interface Exception {
  id: string;
  date: string;
  type: string;
  startTime: string | null;
  endTime: string | null;
}

interface Props {
  exceptions: Exception[];
  onAdd: (ex: { date: string; startTime: string | null; endTime: string | null; type: "BLOCKED" | "BUSY" }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ExceptionsCard({ exceptions, onAdd, onDelete }: Props) {
  const [tab, setTab] = useState<"BLOCKED" | "BUSY">("BLOCKED");
  const [date, setDate] = useState<Date | undefined>();
  const [fullDay, setFullDay] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!date) return;
    if (tab === "BUSY" && (!startTime || !endTime)) return;
    if (!fullDay && tab === "BLOCKED" && (!startTime || !endTime)) return;
    setAdding(true);
    await onAdd({
      date: date.toISOString(),
      startTime: fullDay && tab === "BLOCKED" ? null : startTime || null,
      endTime: fullDay && tab === "BLOCKED" ? null : endTime || null,
      type: tab,
    });
    setDate(undefined);
    setStartTime("");
    setEndTime("");
    setFullDay(true);
    setAdding(false);
  };

  const blocked = exceptions.filter((e) => e.type !== "BUSY");
  const busy = exceptions.filter((e) => e.type === "BUSY");
  const shown = tab === "BLOCKED" ? blocked : busy;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarOff className="h-5 w-5" />
          استثناها
        </CardTitle>
        {/* Tab toggle */}
        <div className="flex gap-1 mt-2 p-1 bg-[var(--muted)] rounded-lg w-fit">
          {(["BLOCKED", "BUSY"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)]",
                tab === t
                  ? "bg-white shadow-sm text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              {t === "BLOCKED" ? (
                <span className="flex items-center gap-1.5"><CalendarOff className="h-3.5 w-3.5" />روز بسته</span>
              ) : (
                <span className="flex items-center gap-1.5"><Ban className="h-3.5 w-3.5" />زمان مشغول</span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Form */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>تاریخ</Label>
              <PersianDatePicker value={date} onChange={setDate} placeholder="انتخاب تاریخ" />
            </div>

            {tab === "BLOCKED" && (
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-sm pb-2">
                  <input
                    type="checkbox"
                    checked={fullDay}
                    onChange={(e) => setFullDay(e.target.checked)}
                    className="rounded"
                  />
                  کل روز
                </label>
              </div>
            )}
          </div>

          {(tab === "BUSY" || (tab === "BLOCKED" && !fullDay)) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>از ساعت</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>تا ساعت</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
          )}

          <Button
            size="sm"
            onClick={handleAdd}
            disabled={adding || !date}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {adding ? "در حال افزودن..." : "افزودن"}
          </Button>
        </div>

        {/* List */}
        {shown.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
            {tab === "BLOCKED" ? "روز بسته‌ای ثبت نشده" : "زمان مشغولی ثبت نشده"}
          </p>
        ) : (
          <div className="space-y-2">
            {shown.map((ex) => (
              <div
                key={ex.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  ex.type === "BUSY"
                    ? "border-orange-200 bg-orange-50"
                    : "border-red-200 bg-red-50"
                )}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      ex.type === "BUSY"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {ex.type === "BUSY" ? "مشغول" : "بسته"}
                  </span>
                  <span className="text-sm font-medium">{toJalali(ex.date)}</span>
                  {ex.startTime && ex.endTime && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {ex.startTime} تا {ex.endTime}
                    </span>
                  )}
                  {!ex.startTime && ex.type === "BLOCKED" && (
                    <span className="text-xs text-[var(--muted-foreground)]">کل روز</span>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(ex.id)}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
