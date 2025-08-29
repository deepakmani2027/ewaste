"use client"

import { AuthProvider } from "@/components/auth/auth-context";
import Scheduling from "@/components/scheduling";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import DashboardTabNav from "@/components/dashboard-tab-nav";
import { cn } from "@/lib/utils";
import styles from "@/components/gradient-scrollbar.module.css";

// This component provides the layout for the scheduling page
function SchedulingPageLayout() {
 return (
  <SidebarProvider>
   <AppSidebar />
   <SidebarInset>
    <DashboardHeader />
    <DashboardTabNav className="mb-1 mt-6 max-w-[95%] mx-auto" />
    <main className={cn("flex-1 p-4 md:p-6", styles.gradientScroll)}>
     <div className="mb-6">
      <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white">
       <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 px-7 py-4">
        <h3 className="text-white font-semibold text-lg tracking-wide">Your Scheduled Pickups</h3>
       </div>
       <div className="px-8 py-3">
        <ul className="list-disc pl-5 text-gray-500 text-sm leading-relaxed space-y-2">
         <li>Review details for all your scheduled e-waste collections.</li>
         <li>Track which vendor has been assigned to each pickup.</li>
         <li>New pickups are scheduled from the main "E-Waste Items" table.</li>
        </ul>
       </div>
      </div>
     </div>
     <Scheduling />
    </main>
   </SidebarInset>
  </SidebarProvider>
 );
}

// The main export for the page, wrapped in the AuthProvider
export default function DashboardSchedulingPage() {
 return (
  <AuthProvider>
   <SchedulingPageLayout />
  </AuthProvider>
 );
}
