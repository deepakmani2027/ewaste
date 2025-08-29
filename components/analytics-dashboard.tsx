"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltip } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts"

// Color generation logic
const CATEGORY_BASE: Record<string,string> = { Computer: "#06b6d4", Projector: "#f97316", "Lab Equipment": "#84cc16", "Mobile Device": "#8b5cf6", Battery: "#ef4444", Accessory: "#22c55e", Other: "#64748b" }
const PALETTE = ["#06b6d4","#f97316","#84cc16","#8b5cf6","#ef4444","#22c55e","#eab308","#10b981","#a855f7","#14b8a6","#f43f5e","#0ea5e9","#f59e0b","#34d399","#64748b","#7c3aed","#059669","#f87171","#38bdf8","#16a34a"]
function hashString(s:string){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function getCategoryColor(name:string){return CATEGORY_BASE[name] ?? PALETTE[hashString(name)%PALETTE.length]}

// --- FIX: The component now accepts the pre-processed 'data' object as a prop ---
export default function AnalyticsDashboard({ data }: { data: any }) {
  const currentYear = new Date().getFullYear()

  // --- FIX: All calculations are now based on the `data` prop ---
  const processedData = useMemo(() => {
    if (!data || !data.totalItems) return null;

    const { byMonth, byCategory, classificationCount, recycledCount, impactKgCO2, potentialKgCO2, totalItems } = data;
    
    const now = new Date();
    const cy = now.getFullYear();
    const currMonth = now.getMonth();
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const monthArr = Array.from({ length: 12 }, (_, m) => {
      const key = `${cy}-${String(m + 1).padStart(2, '0')}`;
      return { month: `${monthNames[m]} ${String(cy).slice(2)}`, fullMonth: key, total: byMonth[key] || 0, isCurrentMonth: m === currMonth, isFutureMonth: m > currMonth };
    });

    const catArr = Object.entries(byCategory).map(([name, value]) => ({ name, value: value as number, color: getCategoryColor(name) }));
    const classArr = Object.entries(classificationCount).map(([name, value]) => ({ name, value: value as number }));

    const activeMonths = monthArr.filter(m => m.total > 0).length || 1;
    const avgPerMonth = totalItems / activeMonths;
    const recyclingRate = totalItems ? (recycledCount / totalItems) * 100 : 0;

    return { monthArr, catArr, classArr, recycledCount, impactKgCO2, potentialKgCO2, totalItems, avgPerMonth, recyclingRate };
  }, [data]);

  if (!processedData) {
    return <Card><CardContent className="p-6 text-center text-muted-foreground">No data available to display.</CardContent></Card>;
  }

  const { monthArr, catArr, classArr, recycledCount, impactKgCO2, potentialKgCO2, totalItems, avgPerMonth, recyclingRate } = processedData;

  const peakMonth = monthArr.length ? monthArr.reduce((a, b) => a.total > b.total ? a : b) : null;
  const currentMonthData = monthArr.find(m => m.isCurrentMonth);
  const lastMonthData = currentMonthData ? monthArr[monthArr.indexOf(currentMonthData) - 1] : undefined;
  const currentGrowth = currentMonthData && lastMonthData && lastMonthData.total > 0 ? ((currentMonthData.total - lastMonthData.total) / lastMonthData.total * 100) : 0;

  return (
    <div className="space-y-10">
      {/* Monthly Volume Chart */}
      <Card>
        <CardHeader><CardTitle>Monthly Volume ({currentYear})</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthArr} margin={{ top: 12, right: 24, left: 8, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} width={40} tick={{ fontSize: 12 }} />
                <ChartTooltip content={({ active, payload, label }) => { if (active && payload?.length) { const m = payload[0].payload; return <div className="rounded border bg-background p-3 shadow-md text-xs space-y-1"><div className="font-medium text-sm">{label}</div><div>Total: {m.total}</div></div> } return null }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {monthArr.map(m => <Cell key={m.fullMonth} fill={m.isCurrentMonth ? '#10b981' : m.isFutureMonth ? '#e5e7eb' : '#3b82f6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { title: 'Peak Month', value: peakMonth ? peakMonth.month : 'N/A', subtitle: peakMonth ? `${peakMonth.total} items` : '' },
              { title: 'This Month', value: `${currentMonthData?.total || 0} items`, subtitle: currentMonthData && lastMonthData ? `${currentGrowth > 0 ? '+' : ''}${currentGrowth.toFixed(1)}% vs last` : 'No previous data' },
              { title: 'Recycled', value: `${recycledCount} (${recyclingRate.toFixed(1)}%)`, subtitle: 'Items recycled' },
              { title: 'Avg Active Month', value: avgPerMonth.toFixed(1), subtitle: 'Items / active month' }
            ].map(card => (
              <div key={card.title} className="bg-muted/40 rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{card.title}</div>
                <div className="font-semibold text-lg mt-1">{card.value}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{card.subtitle}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category & Impact Breakdown */}
      <Card>
        <CardHeader><CardTitle>Category & Impact Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="flex flex-col">
              {catArr.length === 0 ? <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No category data</div> : (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie dataKey="value" data={catArr} innerRadius={55} outerRadius={110} paddingAngle={2}>
                        {catArr.map(slice => <Cell key={slice.name} fill={slice.color} />)}
                      </Pie>
                      <ChartTooltip content={({ active, payload }) => { if (active && payload?.length) { const p = payload[0].payload; const pct = ((p.value / totalItems) * 100).toFixed(1); return <div className="rounded border bg-background p-3 shadow-md text-xs space-y-1"><div className="font-medium text-sm">{p.name}</div><div>Count: {p.value}</div><div>{pct}%</div></div> } return null }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              {catArr.length ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    {catArr.map(c => { const pct = ((c.value / totalItems) * 100).toFixed(1); return <div key={c.name} className="flex items-center justify-between p-2 bg-muted/30 rounded"><div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: c.color }} /> <span className="text-xs font-medium">{c.name}</span></div><div className="text-[11px] text-muted-foreground">{c.value} ({pct}%)</div></div> })}
                  </div>
                  <div className="text-[11px] text-muted-foreground border-t pt-3 leading-snug">
                    CO₂e avoided (est.): <span className="text-green-600 font-semibold">{impactKgCO2.toFixed(1)} kg</span><br />
                    Potential (if fully recycled): {potentialKgCO2.toFixed(1)} kg<br />
                    Tree yr eq*: {(impactKgCO2 / 21.77).toFixed(2)}
                  </div>
                </div>
              ) : <p className="text-xs text-muted-foreground">No data</p>}
            </div>
            <div className="flex flex-col justify-center">
              <h4 className="font-semibold mb-3 text-sm">Classification Breakdown</h4>
              {classArr.length ? (
                <div className="space-y-2">
                  {classArr.map(c => { const pct = totalItems ? (c.value / totalItems) * 100 : 0; const barColor = c.name === 'Hazardous' ? 'bg-rose-500' : c.name === 'Reusable' ? 'bg-emerald-500' : 'bg-amber-500'; return <div key={c.name} className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">{c.name}</span><div className="flex items-center gap-2"><div className="w-32 h-2 bg-muted rounded overflow-hidden"><div className={`h-full ${barColor}`} style={{ width: pct + '%' }} /></div><span className="text-[10px] font-medium">{c.value} ({pct.toFixed(1)}%)</span></div></div> })}
                </div>
              ) : <p className="text-xs text-muted-foreground">No data</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
