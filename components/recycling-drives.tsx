"use client"
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import type { EwItem } from './item-table'
import type { Pickup, Vendor } from './scheduling'
import { CalendarPlus, Recycle, CheckCircle2, XCircle } from 'lucide-react'

export type RecyclingDrive = {
  id: string
  name: string
  startDate: string // YYYY-MM-DD
  endDate: string
  targetDepartments: string[]
  includeHazardous: boolean
  createdAt: string
  status: 'Planned' | 'Active' | 'Completed'
  notes?: string
  pickupIds?: string[]
}

export default function RecyclingDrives({
  items,
  pickups,
  vendors,
  onCreateDrive,
  onUpdateDrive,
  onBulkSchedule,
}: {
  items: EwItem[]
  pickups: Pickup[]
  vendors: Vendor[]
  onCreateDrive: (d: RecyclingDrive) => void
  onUpdateDrive: (d: RecyclingDrive) => void
  onBulkSchedule: (pickup: Pickup) => void
}) {
  const today = new Date().toISOString().slice(0,10)
  const [name, setName] = useState('Campus Recycling Drive')
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(today)
  const [departments, setDepartments] = useState<string[]>([])
  const [includeHaz, setIncludeHaz] = useState(false)
  const [notes, setNotes] = useState('')

  const deptOptions = ['Engineering','Sciences','Humanities','Administration','Hostel','Other']

  const eligibleItems = useMemo(() => {
    return items.filter(i => {
      if (i.status !== 'Reported' && i.status !== 'Scheduled') return false
      if (departments.length && !departments.includes(i.department)) return false
      if (!includeHaz && i.classification.type === 'Hazardous') return false
      return true
    })
  }, [items, departments, includeHaz])

  function createDrive() {
    if (!name.trim()) return
    const drive: RecyclingDrive = {
      id: `d-${Date.now()}`,
      name: name.trim(),
      startDate: start,
      endDate: end,
      targetDepartments: departments,
      includeHazardous: includeHaz,
      createdAt: new Date().toISOString(),
      status: 'Planned',
      notes: notes.trim() || undefined,
      pickupIds: [],
    }
    onCreateDrive(drive)
    setNotes('')
  }

  function bulkSchedule() {
    if (!eligibleItems.length) return
    const vendor = vendors.find(v => v.certified) || vendors[0]
    if (!vendor) return
    const pickup: Pickup = {
      id: `p-${Date.now()}`,
      date: end,
      vendorId: vendor.id,
      itemIds: eligibleItems.map(i => i.id),
      notes: `Bulk scheduled via drive ${name}`,
    }
    onBulkSchedule(pickup)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr] mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Recycling Drive</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Drive name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start</Label>
              <Input type="date" value={start} onChange={e=>setStart(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>End</Label>
              <Input type="date" value={end} onChange={e=>setEnd(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Target Departments</Label>
            <div className="flex flex-wrap gap-2">
              {deptOptions.map(d => {
                const active = departments.includes(d)
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={()=> setDepartments(prev => active ? prev.filter(x=>x!==d) : [...prev,d])}
                    className={`text-xs px-2 py-1 rounded border transition ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-muted'}`}
                  >{d}</button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input id="hazardous" type="checkbox" checked={includeHaz} onChange={e=>setIncludeHaz(e.target.checked)} />
            <Label htmlFor="hazardous" className="cursor-pointer">Include hazardous items</Label>
          </div>
          <div className="grid gap-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
          <div className="text-xs text-muted-foreground">
            Eligible items: <span className="font-semibold">{eligibleItems.length}</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={createDrive} className="flex-1" disabled={!name}> <CalendarPlus className="w-4 h-4 mr-2"/> Save Drive</Button>
            <Button variant="secondary" onClick={bulkSchedule} className="flex-1" disabled={!eligibleItems.length}> <Recycle className="w-4 h-4 mr-2"/> Bulk Schedule</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Current Drives</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border overflow-auto max-h-[460px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Targets</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Eligible</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Drives will be injected by parent */}
                {/* Placeholder row handled externally */}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">Save a drive to list it here. (Parent will render drive rows.)</p>
        </CardContent>
      </Card>
    </div>
  )
}
