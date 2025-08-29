"use client"

import EwastePortal from "@/components/e-waste-portal" // Adjust the import path if necessary
import { AuthProvider } from "@/components/auth/auth-context"
import DashboardHeader from "@/components/dashboard-header";

export default function DashboardPage() {
  // The AuthProvider is essential here to provide the user context
  // to the EwastePortal component and all its children.
  return (
    <>
      <EwastePortal />
      <footer className="w-full mt-8 py-6 bg-gray-50 border-t border-gray-200 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} E-Waste Management Portal. All rights reserved.
      </footer>
    </>
  );
}
