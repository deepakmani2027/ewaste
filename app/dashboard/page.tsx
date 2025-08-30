"use client"

import EwastePortal from "@/components/e-waste-portal"
import { AuthProvider, useAuth } from "@/components/auth/auth-context"

// Main dashboard landing should show the unified portal, not redirect to /dashboard/items

export default function DashboardPage() {
  return (
    <AuthProvider>
      <EwastePortal />
    </AuthProvider>
  )
}
