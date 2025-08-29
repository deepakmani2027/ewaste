"use client"

import { useMemo } from "react"
import type { EwItem, Vendor, Pickup } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, Cell, ResponsiveContainer } from "recharts"

const CATEGORY_BASE: Record<string, string> = {
  "Computer": "#06b6d4",     
  "Projector": "#f97316",      
  "Lab Equipment": "#84cc16",  
  "Mobile Device": "#8b5cf6",  
  "Battery": "#ef4444",        
  "Accessory": "#22c55e",     
  "Other": "#64748b",        
}

// Large palette to cover “any” unknown category with a stable color.
const PALETTE = [
  "#06b6d4","#f97316","#84cc16","#8b5cf6","#ef4444","#22c55e","#eab308",
  "#10b981","#a855f7","#14b8a6","#f43f5e","#0ea5e9","#f59e0b","#34d399",
  "#64748b","#7c3aed","#059669","#f87171","#38bdf8","#16a34a"
]

function hashString(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0)
}

function getCategoryColor(name: string) {
  return CATEGORY_BASE[name] ?? PALETTE[hashString(name) % PALETTE.length]
}

export default function AnalyticsDashboard({ items }: { items: EwItem[] }) {
  const currentYear = new Date().getFullYear()
  
  const data = useMemo(() => {
    const byMonth: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    let recycled = 0
    
    items.forEach((i) => {
      const d = new Date(i.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      byMonth[key] = (byMonth[key] || 0) + 1
      byCategory[i.category] = (byCategory[i.category] || 0) + 1
      if (i.status === "Recycled") recycled++
    })

    // Generate comprehensive monthly data for current year (Jan to Dec)
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() // 0-based (0 = January)
    
    // Generate data for current year (Jan to Dec)
    const monthArr: any[] = []
    for (let month = 0; month < 12; month++) {
      const key = `${currentYear}-${String(month + 1).padStart(2, "0")}`
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const shortLabel = `${monthNames[month]} ${currentYear.toString().slice(2)}`
      
      monthArr.push({
        month: shortLabel,
        fullMonth: key,
        total: byMonth[key] || 0,
        isCurrentMonth: month === currentMonth,
        isFutureMonth: month > currentMonth
      })
    }

    // Calculate monthly growth
    const monthlyWithGrowth = monthArr.map((item, index) => {
      const prevMonth = index > 0 ? monthArr[index - 1] : null
      const growth = prevMonth && prevMonth.total > 0 ? ((item.total - prevMonth.total) / prevMonth.total * 100) : 0
      return { ...item, growth }
    })

    const catArr = Object.entries(byCategory).map(([name, value]) => ({
      name,
      value,
      color: getCategoryColor(name),
    }))
    
    const impactKgCO2 = recycled * 6.5 
    const totalItems = items.length
    const avgPerMonth = monthlyWithGrowth.length > 0 ? totalItems / monthlyWithGrowth.filter(m => m.total > 0).length || 1 : 0
    
    return { 
      monthArr: monthlyWithGrowth, 
      catArr, 
      impactKgCO2, 
      totalItems, 
      avgPerMonth,
      recycledCount: recycled,
      recyclingRate: totalItems > 0 ? (recycled / totalItems * 100) : 0
    }
  }, [items])

  // Make bar chart horizontally scrollable if there are many months
  const barMinWidth = Math.max(560, data.monthArr.length * 80) 

  return (
    <div className="space-y-8 mt-4">
      {/* Monthly Volume - Full Width */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Monthly Volume ({currentYear})</span>
            <div className="text-sm text-muted-foreground font-normal">
              {data.totalItems} total items • Avg: {data.avgPerMonth.toFixed(1)}/month
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="h-[400px] w-full bg-background">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data.monthArr} 
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="month" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 13, fill: 'hsl(var(--muted-foreground))' }}
                  interval={0}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const itemData = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-background p-4 shadow-lg">
                          <div className="font-medium text-base mb-2">{label}</div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-4 h-4 rounded" style={{
                              backgroundColor: itemData.isCurrentMonth ? '#10b981' : 
                                             itemData.isFutureMonth ? '#e5e7eb' : '#3b82f6'
                            }}></div>
                            <span className="font-medium">Items: {payload[0].value}</span>
                          </div>
                          {itemData.growth !== 0 && (
                            <div className="text-sm text-muted-foreground">
                              Growth: <span className={itemData.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                                {itemData.growth > 0 ? '+' : ''}{itemData.growth.toFixed(1)}%
                              </span>
                            </div>
                          )}
                          {itemData.isCurrentMonth && (
                            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2">
                              Current Month
                            </div>
                          )}
                          {itemData.isFutureMonth && (
                            <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mt-2">
                              Future Month
                            </div>
                          )}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  dataKey="total" 
                  radius={[6, 6, 0, 0]}
                  className="hover:opacity-80 transition-opacity"
                >
                  {data.monthArr.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isCurrentMonth ? '#10b981' : 
                           entry.isFutureMonth ? '#e5e7eb' : '#3b82f6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Enhanced Monthly insights */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              {
                title: "Peak Month",
                value: data.monthArr.length > 0 
                  ? data.monthArr.reduce((a, b) => a.total > b.total ? a : b).month
                  : 'N/A',
                subtitle: data.monthArr.length > 0 
                  ? `${data.monthArr.reduce((a, b) => a.total > b.total ? a : b).total} items`
                  : ''
              },
              {
                title: "This Month",
                value: `${data.monthArr.find(m => m.isCurrentMonth)?.total || 0} items`,
                subtitle: data.monthArr.find(m => m.isCurrentMonth)?.growth !== 0 
                  ? `${data.monthArr.find(m => m.isCurrentMonth)?.growth > 0 ? '+' : ''}${data.monthArr.find(m => m.isCurrentMonth)?.growth.toFixed(1)}% vs last month`
                  : 'No previous data'
              },
              {
                title: "Recycled",
                value: `${data.recycledCount} (${data.recyclingRate.toFixed(1)}%)`,
                subtitle: "Total recycled items"
              },
              {
                title: `${currentYear} Trend`,
                value: data.monthArr.length >= 2 
                  ? (data.monthArr[data.monthArr.length - 1].growth > 0 ? '📈 Growing' : 
                     data.monthArr[data.monthArr.length - 1].growth < 0 ? '📉 Declining' : '➡️ Stable')
                  : '📊 New',
                subtitle: "Year-to-date trend"
              }
            ].map((insight, index) => (
              <div 
                key={insight.title}
                className="bg-muted/50 rounded-lg p-4"
              >
                <div className="text-muted-foreground text-xs uppercase tracking-wide">{insight.title}</div>
                <div className="font-semibold text-lg mt-1">{insight.value}</div>
                <div className={`text-xs mt-1 ${insight.title === "This Month" ? "text-green-600" : "text-muted-foreground"}`}>
                  {insight.subtitle}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Analysis - Full Width */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Pie Chart */}
            <div className="flex flex-col">
              {data.catArr.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <div className="text-lg mb-2">📊</div>
                    <p>No category data available yet</p>
                    <p className="text-sm">Add some e-waste items to see category breakdown</p>
                  </div>
                </div>
              ) : (
                <div className="h-[300px] w-full bg-background">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={data.catArr}
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        cx="50%"
                        cy="50%"
                      >
                        {data.catArr.map((slice, idx) => (
                          <Cell key={slice.name} fill={slice.color} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            const percentage = ((data.value / items.length) * 100).toFixed(1)
                            return (
                              <div className="rounded-lg border bg-background p-3 shadow-md">
                                <div className="font-medium">{data.name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-3 h-3 rounded" style={{backgroundColor: data.color}}></div>
                                  <span>Count: {data.value} ({percentage}%)</span>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Category Legend and Stats */}
            <div className="flex flex-col justify-center">
              {data.catArr.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-3">
                    {data.catArr.map((c, idx) => {
                      const percentage = ((c.value / data.totalItems) * 100).toFixed(1)
                      return (
                        <div key={c.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span
                              className="inline-block w-4 h-4 rounded"
                              style={{ backgroundColor: c.color }}
                            />
                            <span className="font-medium">{c.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{c.value}</div>
                            <div className="text-xs text-muted-foreground">{percentage}%</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      Estimated CO₂e saved via recycling:{" "}
                      <span className="font-semibold text-green-600">{data.impactKgCO2.toFixed(1)} kg</span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No category data yet.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
