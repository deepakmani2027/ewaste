
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

function ItemsPageLayout() {
	const [items, setItems] = useState<EwItem[]>([])
	const [vendors, setVendors] = useState<Vendor[]>([])
	const [pickups, setPickups] = useState<Pickup[]>([])
	const { user, isAuthenticated, loading } = useAuth()
	const bcRef = useRef<BroadcastChannel | null>(null)
	const router = useRouter();
	const pathname = usePathname();

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
	}, [user, isAuthenticated, loading, router]);

	async function updateItem(updated: EwItem) {
		if (!user?.email) return;
		const payload = { ...updated, id: updated._id, userEmail: user.email };
		await fetch(`/api/items`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
		refreshData(true);
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
					<DashboardTabNav className="mb-4" />
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
							<ItemForm refreshItems={refreshData} user={user} />
							<ItemTable items={items} vendors={vendors} onUpdate={updateItem} onScheduleQuick={schedulePickup} onDelete={deleteItem} />
						</div>
					</section>
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}

export default function VendorsDashboardItemsPage() {
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
