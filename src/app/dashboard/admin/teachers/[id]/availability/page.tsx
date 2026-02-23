'use client'

import { use, useState, useEffect } from 'react'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { toJalali } from '@/lib/jalali-utils'

const DAYS = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه']

export default function TeacherAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [teacher, setTeacher] = useState<any>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [exceptions, setExceptions] = useState<any[]>([])
  const [newException, setNewException] = useState({ date: '', startTime: '', endTime: '' })

  useEffect(() => {
    fetch(`/api/users/${id}`).then(r => r.json()).then(setTeacher)
    fetch(`/api/teachers/${id}/availability`).then(r => r.json()).then(data => {
      setSlots(data.slots || [])
      setExceptions(data.exceptions || [])
    })
  }, [id])

  const addSlot = (dayOfWeek: number) => {
    setSlots([...slots, { dayOfWeek, startTime: '09:00', endTime: '10:00' }])
  }

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index))
  }

  const updateSlot = (index: number, field: string, value: string) => {
    const updated = [...slots]
    updated[index] = { ...updated[index], [field]: value }
    setSlots(updated)
  }

  const saveSlots = async () => {
    await fetch(`/api/teachers/${id}/availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots })
    })
  }

  const addException = async () => {
    const response = await fetch(`/api/teachers/${id}/availability/exceptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newException)
    })
    const exception = await response.json()
    setExceptions([...exceptions, exception])
    setNewException({ date: '', startTime: '', endTime: '' })
  }

  const deleteException = async (exceptionId: string) => {
    await fetch(`/api/teachers/${id}/availability/exceptions/${exceptionId}`, {
      method: 'DELETE'
    })
    setExceptions(exceptions.filter(e => e.id !== exceptionId))
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="مدیریت زمان آزاد معلم" />
      
      {teacher && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">معلم: {teacher.name}</h2>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">برنامه هفتگی</h3>
        <div className="grid grid-cols-7 gap-4 mb-4">
          {DAYS.map((day, dayIndex) => (
            <div key={dayIndex} className="border rounded p-2">
              <h4 className="font-medium mb-2">{day}</h4>
              {slots.filter(s => s.dayOfWeek === dayIndex).map((slot, slotIndex) => {
                const globalIndex = slots.findIndex(s => s === slot)
                return (
                  <div key={slotIndex} className="space-y-2 mb-2 p-2 bg-gray-50 rounded">
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(globalIndex, 'startTime', e.target.value)}
                    />
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(globalIndex, 'endTime', e.target.value)}
                    />
                    <Button size="sm" variant="destructive" onClick={() => removeSlot(globalIndex)}>
                      حذف
                    </Button>
                  </div>
                )
              })}
              <Button size="sm" onClick={() => addSlot(dayIndex)}>
                افزودن بازه
              </Button>
            </div>
          ))}
        </div>
        <Button onClick={saveSlots}>ذخیره برنامه</Button>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">استثناها</h3>
        <div className="space-y-2 mb-4">
          {exceptions.map((exception) => (
            <div key={exception.id} className="flex items-center justify-between p-2 border rounded">
              <span>
                {toJalali(exception.date)} - {
                  exception.startTime && exception.endTime 
                    ? `${exception.startTime} تا ${exception.endTime}`
                    : 'کل روز'
                }
              </span>
              <Button size="sm" variant="destructive" onClick={() => deleteException(exception.id)}>
                حذف
              </Button>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-4 gap-2 items-end">
          <div>
            <Label>تاریخ</Label>
            <Input
              type="date"
              value={newException.date}
              onChange={(e) => setNewException({...newException, date: e.target.value})}
            />
          </div>
          <div>
            <Label>شروع (اختیاری)</Label>
            <Input
              type="time"
              value={newException.startTime}
              onChange={(e) => setNewException({...newException, startTime: e.target.value})}
            />
          </div>
          <div>
            <Label>پایان (اختیاری)</Label>
            <Input
              type="time"
              value={newException.endTime}
              onChange={(e) => setNewException({...newException, endTime: e.target.value})}
            />
          </div>
          <Button onClick={addException}>افزودن استثنا</Button>
        </div>
      </Card>
    </div>
  )
}