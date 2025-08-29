"use client"

import { AuthProvider, useAuth } from "@/components/auth/auth-context";
import AnalyticsDashboard from "@/components/analytics-dashboard"; // Adjust path if necessary
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard-header";
import DashboardTabNav from "@/components/dashboard-tab-nav";
import { cn } from "@/lib/utils";
import styles from "@/components/gradient-scrollbar.module.css";

// This component fetches data and handles the layout for the analytics page
function AnalyticsPageLayout() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics?userEmail=${encodeURIComponent(user.email)}`);
        const data = await response.json();
        if (response.ok) {
          setAnalyticsData(data);
        } else {
          console.error("Failed to fetch analytics data");
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className={cn("flex-1 p-4 md:p-6", styles.gradientScroll)}>
          <DashboardTabNav className="mb-4" />
          {/* Analytics feature info box */}
          <div className="mb-6">
            <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 px-7 py-4">
                <h3 className="text-white font-semibold text-lg tracking-wide">Data Analytics Dashboard</h3>
              </div>
              <div className="px-8 py-3">
                <ul className="list-disc pl-5 text-gray-500 text-sm leading-relaxed space-y-2">
                  <li>Trends of reported e-waste volume.</li>
                  <li>Segment-wise contributions and recovery rates.</li>
                  <li>Environmental impact estimates from recycling.</li>
                </ul>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-12">Loading analytics...</div>
          ) : analyticsData ? (
            <AnalyticsDashboard data={analyticsData} />
          ) : (
            <div className="text-center py-12">No analytics data to display.</div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// The main export for the page, wrapped in the AuthProvider
export default function DashboardAnalyticsPage() {
  return (
    <AuthProvider>
      
      <AnalyticsPageLayout />
    </AuthProvider>
  );
}
