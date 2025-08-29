"use client"

import { useEffect, useState } from "react"
import { LayoutDashboard, Package, CalendarCheck, UserCircle, LogOut } from 'lucide-react'
import {
Sidebar,
SidebarContent,
SidebarGroup,
SidebarGroupContent,
SidebarGroupLabel,
SidebarHeader,
SidebarMenu,
SidebarMenuButton,
SidebarMenuItem,
SidebarFooter,
} from "@/components/ui/sidebar"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "./auth/auth-context" // Import useAuth

// Define the navigation items for the vendor sidebar
type Item = { title: string; url: string; icon: React.ComponentType<any> }
const items: Item[] = [
 { title: "Dashboard", url: "/vendors/dashboard", icon: LayoutDashboard },
 { title: "Available Items", url: "/vendors/items", icon: Package },
 { title: "My Pickups", url: "/vendors/scheduling", icon: CalendarCheck },
 { title: "My Profile", url: "/vendors/profile", icon: UserCircle },
]

export function VendorSidebar() {
  const { user, logout } = useAuth(); // Get user and logout function
 const pathname = usePathname();
 const router = useRouter();
 const [active, setActive] = useState(pathname)
 const [pressed, setPressed] = useState<string | null>(null)

 useEffect(() => {
  setActive(pathname);
 }, [pathname]);

 const handleNavigation = (url: string) => {
  router.push(url);
  setPressed(url);
  window.setTimeout(() => setPressed(null), 450);
 }
  
  const handleLogout = () => {
    logout();
    window.location.href = "/"; // Force a full page reload to the homepage
  }

 return (
  <Sidebar collapsible="icon" className="border-r flex flex-col">
   <SidebarHeader className="py-4 pl-8">
    <SidebarGroup>
     <SidebarGroupLabel className="text-2xl font-extrabold tracking-wide pl-7 vendor-gradient-text">
      Vendor Portal
     </SidebarGroupLabel>
    </SidebarGroup>
   </SidebarHeader>
   <hr />

      <SidebarContent className="flex-1">
        <SidebarMenu className="gap-3 px-2 mt-4">
          {items.map((item, index) => {
            const Icon = item.icon
            const isActive = active === item.url
            const isPressed = pressed === item.url
            return (
              <SidebarMenuItem key={item.title} className={`relative ${index > 0 ? 'mt-3' : ''}`}>
                <span
                  aria-hidden
                  className={`pointer-events-none absolute left-0 top-0 bottom-0 h-full w-1 rounded-r-full transition-all group-data-[collapsible=icon]:hidden ${
                    isActive ? "bg-gradient-to-b from-emerald-500 via-teal-500 to-purple-600 opacity-100" : "opacity-0"
                  }`}
                />
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link
                    href={item.url}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation(item.url);
                    }}
                    className={`relative w-full rounded-r-xl rounded-l-sm transition-all duration-200 py-8 px-7 mr-2
                      hover:!bg-transparent hover:!text-foreground dark:hover:!text-foreground
                      group-data-[collapsible=icon]:-translate-x-0.5 md:group-data-[collapsible=icon]:-translate-x-1
                      ${isActive ? "text-emerald-700 dark:text-emerald-300 vendor-glow-active" : "text-foreground"}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {isPressed && <span className="vendor-ripple" />}

                    <div className={`relative grid place-items-center rounded-lg transition-transform duration-200
                      group-data-[collapsible=icon]:-translate-x-0.5 md:group-data-[collapsible=icon]:-translate-x-1
                      ${isActive ? "scale-110" : ""}`}>
                      <Icon
                        className={`h-6 w-6 ${isActive ? "text-emerald-600 dark:text-emerald-300" : "text-foreground"}`}
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

      {/* --- FIX: Added a beautiful logout button in the footer --- */}
      <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton 
                    onClick={handleLogout}
                    className="w-full justify-start hover:bg-red-50 hover:text-red-600"
                    tooltip="Logout"
                >
                    <div className="rounded-full bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center text-lg font-semibold text-white w-11 h-11 group-data-[collapsible=icon]:w-20 group-data-[collapsible=icon]:h-20 group-data-[collapsible=icon]:text-lg">
                        {(user?.name || user?.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="hidden md:flex flex-col items-start ml-3 group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-medium">{user?.name || "Vendor"}</span>
                        <span className="text-xs text-muted-foreground">Logout</span>
                    </div>
                    <LogOut className="h-5 w-5 ml-auto hidden md:inline text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Add CSS styles */}
      <style jsx global>{`
        .vendor-gradient-text {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .vendor-glow-active {
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }
        
        .vendor-ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: rgba(16, 185, 129, 0.3);
          transform: translate(-50%, -50%) scale(0);
          animation: vendor-ripple 0.6s ease-out;
          pointer-events: none;
        }
        
        @keyframes vendor-ripple {
          to {
            transform: translate(-50%, -50%) scale(10);
            opacity: 0;
          }
        }
        
        /* Button click effect */
        .sidebar-menu-button:active {
          transform: scale(0.97);
          transition: transform 0.2s;
        }
        
        /* Active state styling */
        .sidebar-menu-item[aria-current="page"] {
          background-color: rgba(16, 185, 129, 0.1);
          border-radius: 0 12px 12px 0;
        }
      `}</style>
  </Sidebar>
 )
}