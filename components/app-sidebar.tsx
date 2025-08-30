"use client"

import { useEffect, useState } from "react"
import { Calendar, Home, Truck, FileSpreadsheet, Gift, Factory, Boxes } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import styles from "./sidebar-effects.module.css"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "./auth/auth-context"
import { useSidebar } from "@/components/ui/sidebar"

type Item = { title: string; url: string; icon: React.ComponentType<any> }

const items: Item[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "E-Waste Items", url: "/dashboard/items", icon: Boxes },
  { title: "Scheduling", url: "/dashboard/scheduling", icon: Calendar },
  { title: "Compliance", url: "/dashboard/compliance", icon: FileSpreadsheet },
  { title: "Campaigns", url: "/dashboard/campaigns", icon: Gift },
  { title: "Analytics", url: "/dashboard/analytics", icon: Truck },
  { title: "Vendors", url: "/dashboard/vendors", icon: Factory },
]

export function AppSidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [active, setActive] = useState(pathname)
  const [pressed, setPressed] = useState<string | null>(null)
  const sidebar = useSidebar()

  useEffect(() => {
    // Only rely on pathname (ignore hash) for active state
    setActive(pathname)
  }, [pathname])

  // Simple navigation without legacy hash/tab handling to prevent unintended redirects
  const handleNavigation = (url: string) => {
    router.push(url)
    setPressed(url)
    if (typeof window !== 'undefined') window.setTimeout(() => setPressed(null), 450)
  }

  return (
    <Sidebar collapsible="icon" className="border-r">
      {/* Header */}
      <SidebarHeader className="mt-12">
        <SidebarGroup>
          <SidebarGroupLabel
            className={`text-2xl font-extrabold tracking-wide pl-7 ${styles.gradientText}`}
          >
            E-Waste Portal
          </SidebarGroupLabel>
        </SidebarGroup>
      </SidebarHeader>

      {/* Main menu */}
      <SidebarContent className="flex-1">
        <SidebarMenu className="gap-3 px-2 mt-4">
          {items.map((item, index) => {   {/* ✅ FIX: Added index here */}
            const Icon = item.icon
            const isActive = active === item.url || (item.url !== '/dashboard' && active.startsWith(item.url))
            const isPressed = pressed === item.url
            return (
              <SidebarMenuItem key={item.title} className={`relative ${index > 0 ? "mt-3" : ""}`}>
                {/* 🔴 ACTIVE INDICATOR - Green accent strip on the left */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute left-0 top-0 bottom-0 h-full w-1 rounded-r-full transition-all group-data-[collapsible=icon]:hidden ${
                    isActive
                      ? "bg-gradient-to-b from-emerald-500 via-teal-500 to-purple-600 opacity-100"
                      : "opacity-0"
                  }`}
                />
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link
                    href={item.url}
                    onClick={(e) => { /* direct route navigation only */ handleNavigation(item.url) }}
                    className={[
                      // Base - increased padding for better spacing
                      "relative w-full rounded-r-xl rounded-l-sm transition-all duration-200 py-8 px-4 mr-2",
                      // Remove hovers
                      "hover:!bg-transparent hover:!text-foreground dark:hover:!text-foreground",
                      // Active tint
                      isActive ? "text-emerald-700 dark:text-emerald-300" : "text-foreground",
                      // Slight left shift in icon-only mode
                      "group-data-[collapsible=icon]:-translate-x-0.5 md:group-data-[collapsible=icon]:-translate-x-1",
                      // Optional glow on active (kept)
                      isActive ? styles.glowActive : "",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {isPressed && <span className={styles.ripple} />}

                    <div
                      className={[
                        "relative grid place-items-center rounded-lg transition-transform duration-200",
                        "group-data-[collapsible=icon]:-translate-x-0.5 md:group-data-[collapsible=icon]:-translate-x-1",
                        isActive ? "scale-110" : "",
                      ].join(" ")}
                    >
                      <Icon
                        className={[
                          "h-6 w-6",
                          isActive ? "text-emerald-600 dark:text-emerald-300" : "text-foreground",
                        ].join(" ")}
                      />
                    </div>

                    <span className="hidden md:inline ml-4 tracking-wide text-[16px] font-medium align-middle group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Profile Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="relative">
            <SidebarMenuButton asChild tooltip="Profile">
              <Link
                href="/dashboard/profile"
                className={`relative w-full transition-all duration-200 flex items-center 
                  group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 ${
                  active === "/dashboard/profile"
                    ? "text-emerald-700"
                    : "text-foreground"
                }`}
              >
                {/* Avatar */}
                <div
                  className="
                    rounded-full 
                    bg-gradient-to-br from-emerald-500 to-purple-600 
                    flex items-center justify-center 
                    text-lg font-semibold text-white
                    w-11 h-11 
                    group-data-[collapsible=icon]:w-20 
                    group-data-[collapsible=icon]:h-20 
                    group-data-[collapsible=icon]:text-lg
                  "
                >
                  {(user?.name || user?.email || "U")[0].toUpperCase()}
                </div>

                {/* Label */}
                <span className="hidden md:inline pl-3 text-base font-medium group-data-[collapsible=icon]:hidden">
                  Profile
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
