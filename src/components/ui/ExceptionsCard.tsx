"use client";

import { useState } from "react";
import { Trash2, CalendarOff, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import { toJalali } from "@/lib/jalali-utils";

export interface Exception {
  id: string;
  date: string;
  type: string;
  startTime: string | null;
  endTime: string | null;
}

interface Props {
  exceptions: Exception[];
  onAdd: (ex: { date: string; startTime: string | null; endTime: string | null; type: "BLOCKED" }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ExceptionsCard({ exceptions, onAdd, onDelete }: Props) {
  const [date, setDate] = useState<Date | undefined>();
  const [fullDay, setFullDay] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!date) return;
    if (!fullDay && (!startTime || !endTime)) return;
    setAdding(true);
    await onAdd({
      date: date.toISOString(),
      startTime: fullDay ? null : startTime,
      endTime: fullDay ? null : endTime,
      type: "BLOCKED",
    });
    setDate(undefined);
    setStartTime("");
    setEndTime("");
    setFullDay(true);
    setAdding(false);
  };

  const blocked = exceptions.filter((e) => e.type === "BLOCKED");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarOff className="h-5 w-5" />
          استثناهای تقویم
        </CardTitle>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          روزها یا بازه‌های زمانی خاصی را که معلم در آن‌ها در دسترس <span className="font-medium text-red-500">نیست</span> ثبت کنید — مثلاً مرخصی، بیماری، یا تعطیلات.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>تاریخ</Label>
              <PersianDatePicker value={date} onChange={setDate} placeholder="انتخاب تاریخ" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input
                  type="checkbox"
                  checked={fullDay}
                  onChange={(e) => setFullDay(e.target.checked)}
                  className="rounded"
                />
                کل روز
              </label>
            </div>
          </div>

          {!fullDay && (
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

          <Button size="sm" onClick={handleAdd} disabled={adding || !date} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {adding ? "در حال افزودن..." : "افزودن"}
          </Button>
        </div>

        {blocked.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-4">استثنایی ثبت نشده</p>
        ) : (
          <div className="space-y-2">
            {blocked.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{toJalali(ex.date)}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {ex.startTime && ex.endTime ? `${ex.startTime} تا ${ex.endTime}` : "کل روز"}
                  </span>
                </div>
                <Button
                  size="icon" variant="ghost"
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
