'use client'

import { useState, useEffect } from 'react'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toJalali } from '@/lib/jalali-utils'

type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

interface Refund {
  id: string
  amount: number
  reason: string
  status: RefundStatus
  adminNote?: string
  createdAt: string
  student: { id: string; name: string; phone: string }
  payment: { amount: number; class: { name: string } }
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [filter, setFilter] = useState<RefundStatus | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [adminNote, setAdminNote] = useState('')

  useEffect(() => {
    fetch('/api/refunds')
      .then(res => res.json())
      .then(data => {
        setRefunds(data.refunds)
        setLoading(false)
      })
  }, [])

  const filteredRefunds = refunds.filter(r => filter === 'ALL' || r.status === filter)

  const handleStatusUpdate = async (id: string, status: RefundStatus) => {
    await fetch(`/api/refunds/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote })
    })
    
    setRefunds(prev => prev.map(r => r.id === id ? { ...r, status, adminNote } : r))
    setProcessingId(null)
    setAdminNote('')
  }

  const getStatusBadge = (status: RefundStatus) => {
    const colors = {
      PENDING: 'bg-amber-100 text-amber-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    }
    const labels = { PENDING: 'در انتظار', APPROVED: 'تایید شده', REJECTED: 'رد شده' }
    return <span className={`px-2 py-1 rounded text-sm ${colors[status]}`}>{labels[status]}</span>
  }

  if (loading) return <div>در حال بارگذاری...</div>

  return (
    <div className="space-y-6">
      <DashboardHeader title="مدیریت استرداد" />
      
      <div className="flex gap-2">
        {[
          { key: 'ALL', label: 'همه' },
          { key: 'PENDING', label: 'در انتظار' },
          { key: 'APPROVED', label: 'تایید شده' },
          { key: 'REJECTED', label: 'رد شده' }
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            onClick={() => setFilter(key as any)}
          >
            {label}
          </Button>
        ))}
      </div>

      {filteredRefunds.length === 0 ? (
        <div className="text-center py-8">درخواستی یافت نشد</div>
      ) : (
        <div className="space-y-4">
          {filteredRefunds.map(refund => (
            <Card key={refund.id} className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{refund.student.name}</h3>
                    <p className="text-sm text-gray-600">{refund.student.phone}</p>
                  </div>
                  {getStatusBadge(refund.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>کلاس: {refund.payment.class.name}</div>
                  <div>مبلغ درخواستی: {refund.amount.toLocaleString()} تومان</div>
                  <div>مبلغ اصلی: {refund.payment.amount.toLocaleString()} تومان</div>
                  <div>تاریخ: {toJalali(refund.createdAt)}</div>
                </div>
                
                <div>
                  <p className="text-sm font-medium">دلیل:</p>
                  <p className="text-sm text-gray-600">{refund.reason}</p>
                </div>
                
                {refund.adminNote && (
                  <div>
                    <p className="text-sm font-medium">یادداشت مدیر:</p>
                    <p className="text-sm text-gray-600">{refund.adminNote}</p>
                  </div>
                )}
                
                {refund.status === 'PENDING' && (
                  <div className="space-y-2">
                    {processingId === refund.id ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="یادداشت مدیر (اختیاری)"
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusUpdate(refund.id, 'APPROVED')}
                          >
                            تایید
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(refund.id, 'REJECTED')}
                          >
                            رد
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setProcessingId(null)}
                          >
                            انصراف
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => setProcessingId(refund.id)}
                        >
                          تایید
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setProcessingId(refund.id)}
                        >
                          رد
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}