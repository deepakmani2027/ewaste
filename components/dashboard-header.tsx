"use client"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LogOut, Recycle } from 'lucide-react'
import { useAuth } from "./auth/auth-context"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { useRouter } from "next/navigation"

import { useSidebar } from "@/components/ui/sidebar"
import { useEffect, useState } from "react"

export default function DashboardHeader() {
  const { open, isMobile } = useSidebar ? useSidebar() : { open: true, isMobile: false };
  const [headerWidth, setHeaderWidth] = useState('100vw');

  useEffect(() => {
    // Sidebar width is 22rem (352px)
    if (isMobile) {
      setHeaderWidth('100vw');
    } else {
      setHeaderWidth(open ? 'calc(100vw - 22rem)' : '100vw');
    }
  }, [open, isMobile]);
  const { user, logout } = useAuth()
  const { ref: headerRef, isInView: headerInView } = useScrollAnimation()
  const router = useRouter();

  const handleLogout = () => {
    logout();
  if (typeof window !== 'undefined') window.location.href = "/";
  }

  return (
    <header
      ref={headerRef as any}
      className={`z-50 sticky top-0 max-w-full overflow-hidden border-b border-transparent shadow-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 text-white transition-all duration-700 ease-out ${
        headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
      style={{
        margin: 0,
        padding: 0,
        width: headerWidth,
        maxWidth: '96vw',
        left: !isMobile && open ? '22rem' : '0',
        position: 'sticky',
        transition: 'width 0.3s, left 0.3s',
      }}
    >
   <div className="pointer-events-none absolute inset-0">
    <div className="absolute -top-20 -left-24 h-56 w-56 rounded-full bg-white/15 blur-3xl animate-pulse" />
    <div className="absolute -bottom-24 -right-28 h-64 w-64 rounded-full bg-white/15 blur-3xl animate-pulse delay-1000" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-white/10 blur-2xl animate-pulse delay-500" />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5" />
   </div>
      {/* --- FIX: Reduced vertical padding from py-4 md:py-5 to py-3 md:py-4 --- */}
  <div className="relative flex items-center z-30 gap-4 px-2 py-3 md:px-0 md:py-4 w-full ml-2 mr-2">
      <SidebarTrigger className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-lg p-2 hidden md:inline-flex" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <Recycle className="h-7 w-7 md:h-8 md:w-8 opacity-90 drop-shadow-sm" />
          <div>
            <h1 className="text-lg md:text-2xl font-bold tracking-tight">E‑Waste Management Portal</h1>
            <p className="text-sm md:text-base text-white/90">Track, tag, schedule, and report e‑waste responsibly.</p>
          </div>
        </div>
      </div>
      {/* User info and logout, shifted left */}
      <div className="flex items-center gap-2 mr-8">
        {/* Avatar and name for sm and up */}
        <div className="hidden sm:flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold cursor-pointer"
            onClick={() => router.push('/dashboard/profile')}
            title="Profile"
          >
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <span className="text-sm font-semibold truncate max-w-32">{user?.name || user?.email}</span>
        </div>
        {/* Avatar only for xs */}
        <div className="flex sm:hidden items-center">
          <div
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold cursor-pointer"
            onClick={() => router.push('/dashboard/profile')}
            title="Profile"
          >
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
        </div>
        <Button 
          variant="secondary" 
          className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/40 transition-all duration-200 shadow-lg backdrop-blur-sm font-medium"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
   </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  </header>
 )
}
