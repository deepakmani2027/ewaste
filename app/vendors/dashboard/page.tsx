"use client"

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard-header";
import { DashboardTabNav2 } from "@/components/dashboard-tab-nav2";
import { useAuth } from "@/components/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, CalendarCheck, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

// This is the main component for the Vendor Dashboard page.
// It fetches and displays the vendor's key stats.
export default function VendorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    auctionsWon: 0,
    pickupsScheduled: 0,
    activeBids: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetch(`/api/vendors/stats?vendorId=${user._id}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error("Failed to fetch vendor stats.");
        }
      } catch (error) {
        console.error("Error fetching vendor stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);


  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <VendorSidebar />
        {/* Main Content */}
        <div className="flex-1 p-3 md:p-0 w-full">
          <DashboardHeader />
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name || 'Vendor'}!</h1>
            <p className="text-muted-foreground mt-1">
              Here's a summary of your activity on the e-waste portal.
            </p>
          </header>
          {/* KPI Cards Section */}
          <div className="grid gap-8 md:gap-12 grid-cols-1 sm:grid-cols-4 xl:grid-cols-6">
            <KpiCard title="Auctions Won" value={stats.auctionsWon} icon={<Handshake className="w-8 h-8" />} gradient="from-green-500 to-green-600" />
            <KpiCard title="Active Bids" value={stats.activeBids} icon={<Package className="w-8 h-8" />} gradient="from-blue-500 to-blue-600" />
            <KpiCard title="Scheduled Pickups" value={stats.pickupsScheduled} icon={<CalendarCheck className="w-8 h-8" />} gradient="from-orange-500 to-orange-600" />
          </div>
          {/* Placeholder for future content */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Your recent bids and won items will appear here.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <VendorSidebar />
      {/* Main Content */}
      <div className="flex-1 w-full">
        <DashboardHeader />
        <header className="mb-8 p-4 sm:p-5">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name || 'Vendor'}!</h1>
          <p className="text-muted-foreground mt-1">
            Here's a summary of your activity on the e-waste portal.
          </p>
        </header>
        <div className="mb-4 ml-3">
          <DashboardTabNav2 />
        </div>
        <hr className="mb-3"/>
        {/* KPI Cards Section */}
        <div className="flex flex-wrap gap-8 md:gap-12 px-3 justify-start ml-4">
          <KpiCard title="Auctions Won" value={stats.auctionsWon} icon={<Handshake className="w-8 h-8" />} gradient="from-green-500 to-green-600" />
          <KpiCard title="Active Bids" value={stats.activeBids} icon={<Package className="w-8 h-8" />} gradient="from-blue-500 to-blue-600" />
          <KpiCard title="Scheduled Pickups" value={stats.pickupsScheduled} icon={<CalendarCheck className="w-8 h-8" />} gradient="from-orange-500 to-orange-600" />
        </div>
        {/* Placeholder for future content */}
        <div className="mt-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your recent bids and won items will appear here.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { VendorSidebar } from "@/components/vendor-sidebar";
// A reusable KPI Card component for the dashboard
function KpiCard({ title, value, icon, gradient }: { title: string; value: number | string; icon: React.ReactNode; gradient: string }) {
  return (
    <Card
      className={cn(
        "text-white border-0 transition-transform duration-200 ease-in-out cursor-pointer shadow-lg hover:scale-105 hover:shadow-2xl",
        "min-w-[260px] max-w-full md:w-[320px] min-h-[180px] rounded-2xl flex-1 md:flex-none",
        `bg-gradient-to-br ${gradient}`
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between h-full">
          <div>
            <p className="text-lg opacity-90 font-medium mb-2">{title}</p>
            <p className="text-4xl font-extrabold drop-shadow-lg">{value}</p>
          </div>
          <div className="opacity-90 flex items-center justify-center">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
