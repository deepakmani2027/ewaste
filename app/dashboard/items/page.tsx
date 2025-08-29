"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import styles from "@/components/gradient-scrollbar.module.css"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { ScanLine, Shield, Sparkles, TrendingUp } from 'lucide-react'
import ItemForm from "@/components/item-form"
import ItemTable from "@/components/item-table"
import { cn } from "@/lib/utils"
import { useAuth, AuthProvider } from "@/components/auth/auth-context"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import type { EwItem, Vendor, Pickup } from "@/lib/types"
import DashboardHeader from "@/components/dashboard-header"
import DashboardTabNav from "@/components/dashboard-tab-nav"
import dynamic from 'next/dynamic';

const DynamicItemForm = dynamic(() => import('@/components/item-form'), { ssr: false });
const DynamicItemTable = dynamic(() => import('@/components/item-table'), { ssr: false });

// This is the main layout component for the Items page
function ItemsPageLayout() {
  const [items, setItems] = useState<EwItem[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [pickups, setPickups] = useState<Pickup[]>([])
  
  const { user, isAuthenticated, loading } = useAuth()
  const bcRef = useRef<BroadcastChannel | null>(null)
  const router = useRouter();
  const pathname = usePathname();
  
  // --- FIX: Removed the faulty useStaggeredAnimation hook ---

  // Centralized data fetching for this page
  async function refreshData(broadcast: boolean = false) {
    if (!user?.email) {
      setItems([]);
      setVendors([]);
      setPickups([]);
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
        setVendors(schedulingData.vendors || []);
        setPickups(schedulingData.pickups || []);
      }
      if (broadcast && bcRef.current) {
        bcRef.current.postMessage({ type: 'updated', source: 'items-page' })
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
    if (typeof window !== 'undefined' && !bcRef.current) {
      bcRef.current = new BroadcastChannel('ew-items')
      bcRef.current.onmessage = (ev) => {
        if (ev.data?.type === 'updated') {
          refreshData();
        }
      }
    }
    return () => {
      if (bcRef.current) bcRef.current.onmessage = null
    }
  }, []); // Empty dependency array ensures this runs once on client mount

  // Handler functions to pass down to child components
  async function updateItem(updated: EwItem) {
    if (!user?.email) return;
    await fetch(`/api/items?userEmail=${encodeURIComponent(user.email)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
- refreshData();
 // FIX: Changed method to PATCH and adjusted the payload to match the API route
 const payload = { ...updated, id: updated._id, userEmail: user.email };
 await fetch(`/api/items`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
 refreshData(true); // broadcast update
}

  async function deleteItem(itemId: string) {
    if (!user?.email) return;
    await fetch(`/api/items?id=${itemId}&userEmail=${encodeURIComponent(user.email)}`, { method: 'DELETE' });
    refreshData(true);
  }

  async function schedulePickup(p: Omit<Pickup, '_id' | 'id' | 'createdBy'>) {
    if (!user?.email) return;
    const payload = { ...p, createdBy: user.email };
    await fetch('/api/scheduling', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    refreshData();
  }

  const analytics = useMemo(() => {
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
  <main className={cn("flex-1 p-4 md:p-6", styles.gradientScroll)}>
          {/* --- FIX: Removed top padding (pt-4 md:pt-6) to eliminate extra space --- */}
          {/* <section id="dashboard-kpis" className="px-4 md:px-6 pb-4 md:pb-6 mt-4 md:mt-6">
             <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { title: "Your Total Items", value: analytics.total, icon: <ScanLine className="w-5 h-5" />, gradient: "from-emerald-500 via-teal-500 to-purple-600" },
                { title: "Hazardous Items", value: analytics.hazardousCount, icon: <Shield className="w-5 h-5" />, gradient: "from-rose-500 via-orange-500 to-amber-500" },
                { title: "Recovery Rate", value: `${analytics.recoveryRate.toFixed(1)}%`, icon: <TrendingUp className="w-5 h-5" />, gradient: "from-fuchsia-500 via-purple-500 to-violet-500" },
                { title: "Active Campaigns", value: analytics.activeCampaigns, icon: <Sparkles className="w-5 h-5" />, gradient: "from-lime-500 via-emerald-500 to-teal-500" }
              ].map((kpi, index) => (
                // --- FIX: Replaced complex animation with a simple, reliable fade-in ---
                <div
                  key={kpi.title}
                  className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <KpiCard title={kpi.title} value={kpi.value} icon={kpi.icon} gradient={kpi.gradient} />
                </div>
              ))}
            </div>
          </section> */}

          {/* Removed top separator per request */}

          <DashboardTabNav className="mb-4" />

          {/* Info box (width aligned with scheduling page by removing inner horizontal padding wrapper) */}
          <div className="mb-3">
            <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 px-7 py-4">
                <h3 className="text-white font-semibold text-lg tracking-wide">Centralized E-Waste, QR Tagging & Smart Sorting</h3>
              </div>
              <div className="px-8 py-3">
                <ul className="list-disc pl-5 text-gray-500 text-sm leading-relaxed space-y-2">
                  <li>Log items by department, category, age, and condition.</li>
                  <li>Auto‑generate QR codes for traceable tagging, movement, and status.</li>
                  <li>Automated classification (Recyclable, Reusable, Hazardous) with scheduling hints.</li>
                </ul>
              </div>
            </div>
          </div>

          <section id="items-management" className="pb-5 md:pb-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[0.38fr_0.62fr] xl:grid-cols-[0.35fr_0.65fr] items-start">
              <DynamicItemForm refreshItems={refreshData} user={user} />
              <DynamicItemTable items={items} vendors={vendors} onUpdate={updateItem} onScheduleQuick={schedulePickup} onDelete={deleteItem} />
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

// The main export for the page, wrapped in the AuthProvider
export default function DashboardItemsPage() {
  return (
    <AuthProvider>
      <ItemsPageLayout />
    </AuthProvider>
  );
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
