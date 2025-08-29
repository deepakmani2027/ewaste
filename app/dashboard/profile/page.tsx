"use client"

import { useEffect, useMemo, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import styles from "@/components/gradient-scrollbar.module.css"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScanLine, Shield, Sparkles, TrendingUp, User, KeyRound, Trash2, Bell, Recycle } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useAuth, AuthProvider } from "@/components/auth/auth-context"
import { useRouter } from "next/navigation"
import { useStaggeredAnimation } from "@/hooks/use-scroll-animation"
import type { EwItem } from "@/lib/types"
import DashboardHeader from "@/components/dashboard-header"
import DashboardTabNav from "@/components/dashboard-tab-nav"

function ProfilePageLayout() {
  const { user, logout, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<EwItem[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { ref: kpiRef, visibleItems: visibleKpis } = useStaggeredAnimation(4, 100);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
    if (isAuthenticated && user?.email) {
      fetch(`/api/items?userEmail=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => setItems(data));
    }
  }, [user, isAuthenticated, authLoading, router]);

  const analytics = useMemo(() => {
    const total = items.length;
    const hazardousCount = items.filter(i => i.classification?.type === 'Hazardous').length;
    const recoveryRate = total > 0 ? ((total - hazardousCount) / total) * 100 : 0;
    const activeCampaigns = items.length > 5 ? 4 : items.length > 2 ? 2 : 1;
    return { total, hazardousCount, recoveryRate, activeCampaigns };
  }, [items]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "New passwords do not match." });
      return;
    }
    const res = await fetch('/api/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user?.email, oldPassword, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ type: 'success', text: data.message });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setMessage({ type: 'error', text: data.message });
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you absolutely sure? This will permanently delete your account and all of your e-waste items. This action cannot be undone.")) {
      const res = await fetch(`/api/user?userEmail=${encodeURIComponent(user!.email!)}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Account deleted successfully.");
        logout();
        router.push("/");
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message });
      }
    }
  };

  if (authLoading || !isAuthenticated) {
    return <div className="flex h-screen w-full items-center justify-center"><div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className={cn("flex-1", styles.gradientScroll)}>
          <section id="kpis" className="p-4 md:p-6">
            {/* --- FIX: Added Summary title --- */}
            <h2 className="text-2xl font-bold tracking-tight mb-4">Summary</h2>
          </section>
          <div className="p-4 md:p-6 grid gap-6 lg:grid-cols-2">
            {/* User Profile & Account Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User /> Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 ml-[-12px]">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user?.name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
                </div>

                {message && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'bg-green-100 border-green-300 text-green-800' : ''}>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold flex items-center gap-2"><KeyRound size={16}/> Change Password</h4>
                    <div className="space-y-2">
                        <Label htmlFor="old-password">Old Password</Label>
                        <Input id="old-password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                    <Button type="submit">Update Password</Button>
                </form>

                <div className="pt-4 border-t">
                    <h4 className="font-semibold text-red-600 flex items-center gap-2"><Trash2 size={16}/> Danger Zone</h4>
                    <p className="text-sm text-muted-foreground mt-2">Deleting your account is permanent. All of your data, including e-waste items, will be removed forever.</p>
                    <Button variant="destructive" className="mt-4" onClick={handleDeleteAccount}>Delete My Account</Button>
                </div>
              </CardContent>
            </Card>

            {/* Creative Filler - Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell /> Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.slice(0, 5).map(item => (
                    <div key={item._id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <Recycle size={16} className="text-gray-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">You reported a new item: <span className="font-semibold">{item.name}</span></p>
                            <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-sm text-muted-foreground">No recent activity. Add an item to get started!</p>}
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardProfilePage() {
  return (
    <AuthProvider>
      <ProfilePageLayout />
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
