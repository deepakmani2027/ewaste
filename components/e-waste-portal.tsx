"use client"

import { useEffect, useMemo, useState } from "react"
import { AppSidebar } from "./app-sidebar"
import styles from "./gradient-scrollbar.module.css"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, ScanLine, Shield, Sparkles, TrendingUp, LogOut, Recycle } from 'lucide-react'
import ItemForm from "./item-form"
import ItemTable from "./item-table"
import Scheduling from "./scheduling"
import Vendors from "./vendors"
import ComplianceReport from "./compliance-report"
import Campaigns from "./campaigns"
import AnalyticsDashboard from "./analytics-dashboard"
import { cn } from "@/lib/utils"
import { useAuth } from "./auth/auth-context"
import { useRouter } from "next/navigation"
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation"
import type { EwItem, Vendor, Pickup } from "@/lib/types"
import DashboardHeader from "./dashboard-header"
import NamasteBanner from "./namaste-banner"

const TAB_KEYS = ["items", "scheduling", "compliance", "campaigns", "analytics", "vendors"] as const
type TabKey = (typeof TAB_KEYS)[number]

function isTabKey(k: string): k is TabKey {
  return (TAB_KEYS as readonly string[]).includes(k)
}
function getHashKey(): TabKey | null {
  const h = (typeof window !== "undefined" && window.location.hash.replace("#", "")) || ""
  return isTabKey(h) ? (h as TabKey) : null
}

export default function EwastePortal() {
  const [items, setItems] = useState<EwItem[]>([])
  const [pickups, setPickups] = useState<Pickup[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>(getHashKey() || "items")
  const { ref: kpiRef, visibleItems: visibleKpis } = useStaggeredAnimation(4, 100)

  async function refreshData() {
    if (!user?.email) {
      setItems([]);
      setPickups([]);
      setVendors([]);
      return;
    }
    try {
      const [itemsRes, schedulingRes] = await Promise.all([
        fetch(`/api/items?userEmail=${encodeURIComponent(user.email)}`),
        fetch(`/api/scheduling?userEmail=${encodeURIComponent(user.email)}`)
      ]);

      if (itemsRes.ok) setItems(await itemsRes.json());
      
      if (schedulingRes.ok) {
        const schedulingData = await schedulingRes.json();
        setPickups(schedulingData.pickups || []);
        setVendors(schedulingData.vendors || []);
      }
      
    } catch (error) {
      console.error("An error occurred while fetching portal data:", error);
    }
  }

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
    if (isAuthenticated) {
      refreshData();
    }
  }, [user, isAuthenticated, loading, router]);

  useEffect(() => {
    const onTabChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ activeTab: string }>).detail
      if (detail?.activeTab && isTabKey(detail.activeTab)) {
        setTab(detail.activeTab)
      }
    }
    window.addEventListener("ew:tab-changed", onTabChanged as any)
    const k = getHashKey()
    if (k) setTab(k)
    return () => {
      window.removeEventListener("ew:tab-changed", onTabChanged as any)
    }
  }, [])

 async function updateItem(updated: EwItem) { 
    if (!user?.email) return;
    await fetch(`/api/items?userEmail=${encodeURIComponent(user.email)}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(updated) 
    });
    refreshData();
  }

  async function deleteItem(itemId: string) { 
    if (!user?.email) return;
    await fetch(`/api/items?id=${itemId}&userEmail=${encodeURIComponent(user.email)}`, { 
        method: 'DELETE' 
    });
    refreshData();
  }

  async function schedulePickup(p: Omit<Pickup, '_id' | 'id' | 'createdBy'>) {
    if (!user?.email) return;
    const payload = { ...p, createdBy: user.email };
    await fetch('/api/scheduling', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
    });
    refreshData();
  }

  async function addVendor(data: Omit<Vendor, '_id' | 'id'>) { 
    await fetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    refreshData();
  }
  async function updateVendor(updated: Vendor) { 
    await fetch('/api/vendors', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    refreshData();
  }
  async function removeVendor(vendorId: string) { 
    await fetch(`/api/vendors?id=${vendorId}`, { method: 'DELETE' });
    refreshData();
  }

  // --- FIX: Perform the full analytics calculation here ---
  const analyticsData = useMemo(() => {
    const byMonth: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    const classificationCount: Record<string, number> = { Recyclable: 0, Reusable: 0, Hazardous: 0 }
    
    const weightMap: Record<string, number> = { Computer: 7, Projector: 3, "Lab Equipment": 10, "Mobile Device": 0.2, Battery: 0.05, Accessory: 0.1, Other: 1 }
    const emissionFactorPerKg = 1.8
  const progressMultiplier: Record<string, number> = { Reported: 0, Scheduled: 0.15, Collected: 0.35, Sorted: 0.55, Processed: 0.75, Recycled: 1.0, Disposed: 0, Decomposed: 0 }
    
    let recycledCount = 0
    let avoidedImpact = 0
    let potentialImpact = 0
    
    items.forEach(i => {
      const d = new Date(i.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      byMonth[key] = (byMonth[key] || 0) + 1
      byCategory[i.category] = (byCategory[i.category] || 0) + 1
      if (i.classification) {
        classificationCount[i.classification.type] = (classificationCount[i.classification.type] || 0) + 1
      }

  if (i.classification?.type !== 'Hazardous' && i.status !== 'Disposed' && i.status !== 'Decomposed') {
        const weight = weightMap[i.category] ?? 1
        const fullImpact = weight * emissionFactorPerKg
        potentialImpact += fullImpact
        const mult = progressMultiplier[i.status] ?? 0
        avoidedImpact += fullImpact * mult
        if (i.status === 'Recycled') recycledCount++
      }
    })

    return {
      byMonth,
      byCategory,
      classificationCount,
      recycledCount,
      impactKgCO2: avoidedImpact,
      potentialKgCO2: potentialImpact,
      totalItems: items.length,
    }
  }, [items]);

  const kpiStats = useMemo(() => {
    const total = items.length;
    const hazardousCount = items.filter(i => i.classification?.type === 'Hazardous').length;
    const recoveryRate = total > 0 ? ((total - hazardousCount) / total) * 100 : 0;
    const activeCampaigns = items.length > 5 ? 4 : items.length > 2 ? 2 : 1;
    return { total, hazardousCount, recoveryRate, activeCampaigns };
  }, [items]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className={cn("flex-1", styles.gradientScroll)}>
          <section id="dashboard" className="p-4 md:p-6">
            {/* Namaste Banner */}
            <NamasteBanner />
            <div 
              ref={kpiRef as any}
              className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
            >
              {[
                { title: "Your Total Items", value: kpiStats.total, icon: <ScanLine className="w-5 h-5" />, gradient: "from-emerald-500 via-teal-500 to-purple-600" },
                { title: "Hazardous Items", value: kpiStats.hazardousCount, icon: <Shield className="w-5 h-5" />, gradient: "from-rose-500 via-orange-500 to-amber-500" },
                { title: "Recovery Rate", value: `${kpiStats.recoveryRate.toFixed(1)}%`, icon: <TrendingUp className="w-5 h-5" />, gradient: "from-fuchsia-500 via-purple-500 to-violet-500" },
                { title: "Active Campaigns", value: kpiStats.activeCampaigns, icon: <Sparkles className="w-5 h-5" />, gradient: "from-lime-500 via-emerald-500 to-teal-500" }
              ].map((kpi, index) => (
                <div
                  key={kpi.title}
                  className={`transition-all duration-500 ease-out ${
                    visibleKpis.includes(index)
                      ? 'opacity-100 translate-y-0 scale-100'
                      : 'opacity-0 translate-y-6 scale-95'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <KpiCard title={kpi.title} value={kpi.value} icon={kpi.icon} gradient={kpi.gradient} />
                </div>
              ))}
            </div>
          </section>

          <Separator className="my-2" />

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 m-8">
            {[
              {
                key: 'items',
                label: 'Items',
                icon: <ScanLine className="w-8 h-8 text-emerald-600" />, 
                gradient: 'from-emerald-100 via-teal-100 to-purple-100',
                border: 'border-emerald-400',
                desc: 'Manage and track your e-waste items.'
              },
              {
                key: 'scheduling',
                label: 'Scheduling',
                icon: <Download className="w-8 h-8 text-blue-600" />, 
                gradient: 'from-blue-100 via-indigo-100 to-blue-50',
                border: 'border-blue-400',
                desc: 'Schedule pickups and collections.'
              },
              {
                key: 'compliance',
                label: 'Compliance',
                icon: <Shield className="w-8 h-8 text-amber-600" />, 
                gradient: 'from-amber-100 via-orange-100 to-amber-50',
                border: 'border-amber-400',
                desc: 'View compliance and safety reports.'
              },
              {
                key: 'campaigns',
                label: 'Campaigns',
                icon: <Sparkles className="w-8 h-8 text-pink-600" />, 
                gradient: 'from-pink-100 via-rose-100 to-rose-50',
                border: 'border-pink-400',
                desc: 'Promote and join recycling campaigns.'
              },
              {
                key: 'analytics',
                label: 'Analytics',
                icon: <TrendingUp className="w-8 h-8 text-purple-600" />, 
                gradient: 'from-purple-100 via-violet-100 to-fuchsia-100',
                border: 'border-purple-400',
                desc: 'Analyze your e-waste data.'
              },
              {
                key: 'vendors',
                label: 'Vendors',
                icon: <Recycle className="w-8 h-8 text-green-600" />, 
                gradient: 'from-green-100 via-emerald-100 to-teal-100',
                border: 'border-green-400',
                desc: 'Manage recycling vendors.'
              },
            ].map(card => (
              <button
                key={card.key}
                onClick={() => router.push(`/dashboard/${card.key}`)}
                className={`group w-full h-full rounded-2xl border-2 ${card.border} bg-gradient-to-br ${card.gradient} shadow-md hover:shadow-xl transition-all duration-200 p-6 flex flex-col items-center justify-center cursor-pointer focus:outline-none`}
                style={{ minHeight: 170 }}
              >
                <div className="mb-2">{card.icon}</div>
                <div className="text-xl font-bold mb-1 text-gray-800 group-hover:text-black">{card.label}</div>
                <div className="text-sm text-gray-500 text-center">{card.desc}</div>
              </button>
            ))}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function KpiCard({ title, value, icon, gradient }: { title: string; value: number | string; icon: React.ReactNode; gradient: string }) {
  return (
    <Card className={cn("group relative overflow-hidden border-0 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1", `bg-gradient-to-br ${gradient}`)}>
      <CardContent className="relative p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-base md:text-lg font-extrabold tracking-wider uppercase opacity-90">{title}</p>
          <div className="p-2 rounded-lg bg-white/15">
            <span>{icon}</span>
          </div>
        </div>
        <p className="text-3xl md:text-4xl font-black">{value}</p>
      </CardContent>
    </Card>
  )
}
function FeatureHeader({ title, bullets }: { title: string; bullets: string[] }) { return <div>...</div> }
