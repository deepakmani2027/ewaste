"use client"

import Vendors from "@/components/vendors"; // Adjust path if necessary
import { AppSidebar } from "@/components/app-sidebar"; // Import the sidebar
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import DashboardTabNav from "@/components/dashboard-tab-nav";
import styles from "@/components/gradient-scrollbar.module.css";
import { cn } from "@/lib/utils";

// The main export for the page.
// The AuthProvider is no longer needed here because it's in the root layout.
export default function DashboardVendorsPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className={cn("flex-1 p-4 md:p-6", styles.gradientScroll)}>
          <DashboardTabNav className="mb-4" />
          {/* Vendor feature info box */}
          <div className="mb-6">
            <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 px-7 py-4">
                <h3 className="text-white font-semibold text-lg tracking-wide">Vendor Management</h3>
              </div>
              <div className="px-8 py-3">
                <ul className="list-disc pl-5 text-gray-500 text-sm leading-relaxed space-y-2">
                  <li>Manage registered e-waste vendors and recyclers.</li>
                  <li>Track vendor certifications and credentials.</li>
                  <li>Maintain vendor contact information and services.</li>
                </ul>
              </div>
            </div>
          </div>
          <Vendors />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
