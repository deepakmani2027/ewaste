"use client"

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { motion } from "framer-motion";
import {
 BookOpen,
 Beaker,
 PenTool,
 Building,
 Home,
 Users,
 Medal,
 Loader2,
 AlertTriangle,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard-header";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import type { EwItem } from "@/lib/types";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardTabNav from "@/components/dashboard-tab-nav";
import { cn } from "@/lib/utils";
import styles from "@/components/gradient-scrollbar.module.css";

type Dept = EwItem["department"];

const DEPT_ICONS: Record<Dept, any> = {
 Engineering: BookOpen,
 Sciences: Beaker,
 Humanities: PenTool,
 Administration: Building,
 Hostel: Home,
 Other: Users,
};

export default function DashboardCampaignsPage() {
 const { user, isAuthenticated, loading: authLoading } = useAuth();
 const router = useRouter();
 const [items, setItems] = useState<EwItem[]>([]);
 const [allItems, setAllItems] = useState<EwItem[]>([]);
 const bcRef = useRef<BroadcastChannel | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [joinedChallenge, setJoinedChallenge] = useState(false);
 const { ref: challengeRef, isInView: challengeInView } = useScrollAnimation();
 const [awardedVouchers, setAwardedVouchers] = useState<{
    code: string;
    pointsGoal: number;
    claimed: boolean;
  }[]>([]);

  // Load awarded vouchers from localStorage on mount
  useEffect(() => {
    const storedVouchers = localStorage.getItem(`ew:vouchers:${user?.email}`);
    if (storedVouchers) {
      setAwardedVouchers(JSON.parse(storedVouchers));
    }
  }, [user?.email]);

 useEffect(() => {
    if (authLoading) {
   return;
  }

  if (!isAuthenticated && !authLoading) {
    router.replace("/login");
    return;
  }

  const fetchItems = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [userRes, allRes] = await Promise.all([
        fetch(`/api/items?userEmail=${encodeURIComponent(user.email)}`),
        fetch(`/api/all-items`)
      ]);
      if (!userRes.ok) throw new Error('Failed to fetch your items');
      if (!allRes.ok) throw new Error('Failed to fetch global items');
      const userData = await userRes.json();
      const globalData = await allRes.json();
      setItems(Array.isArray(userData) ? userData : []);
      setAllItems(Array.isArray(globalData) ? globalData : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching campaign data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
    fetchItems();

    if (typeof window !== 'undefined' && !bcRef.current) {
      bcRef.current = new BroadcastChannel('ew-items');
      bcRef.current.onmessage = (ev) => {
        if (ev.data?.type === 'updated') {
          fetchItems();
        }
      };
    }
    return () => {
      if (bcRef.current) {
        bcRef.current.onmessage = null;
      }
    }
 }, [user, authLoading, isAuthenticated, router]);

 const scoreboard = useMemo(() => {
  const byDept: Record<Dept, { count: number; points: number }> = {
    Engineering: { count: 0, points: 0 },
    Sciences: { count: 0, points: 0 },
    Humanities: { count: 0, points: 0 },
    Administration: { count: 0, points: 0 },
    Hostel: { count: 0, points: 0 },
    Other: { count: 0, points: 0 },
  };
  const mine = allItems.filter(i => i.createdBy === user?.email);
  mine.forEach(i => {
    if (i.classification) {
      byDept[i.department].count++;
      if (i.classification.type === 'Hazardous') byDept[i.department].points += 20;
      else if (i.classification.type === 'Reusable') byDept[i.department].points += 15;
      else if (i.classification.type === 'Recyclable') byDept[i.department].points += 10;
    }
  });
  return (Object.entries(byDept) as [Dept, { count: number; points: number }][])
    .filter(([, stats]) => stats.count > 0)
    .sort((a, b) => b[1].points - a[1].points);
 }, [allItems, user?.email]);

    const userStats = useMemo(() => {
      if (!user?.email) return { basePoints: 0, weeklyBonus: 0, weeklyItems: 0, itemsReported: 0, progress: 0 };
      let basePoints = 0;
      let itemsReported = 0;
      let weeklyItems = 0;
      const now = Date.now();
      allItems.forEach(i => {
        if (i.createdBy === user.email) {
          itemsReported++;
            if (i.classification?.type === 'Hazardous') basePoints += 20;
            else if (i.classification?.type === 'Reusable') basePoints += 15;
            else if (i.classification?.type === 'Recyclable') basePoints += 10;
            if (i.createdAt) {
              const t = new Date(i.createdAt).getTime();
              const days = (now - t) / 86400000;
              if (days <= 7) weeklyItems++;
            }
        }
      });
      const weeklyBonus = weeklyItems * 5;
      const progress = Math.min(basePoints, 100);
  return { basePoints, weeklyBonus, weeklyItems, itemsReported, progress, totalPoints: basePoints + weeklyBonus };
    }, [allItems, user?.email]);

    // Logic to award dummy gift vouchers
    useEffect(() => {
      const checkAndAwardVoucher = (goal: number, message: string) => {
        const alreadyAwarded = awardedVouchers.some(v => v.pointsGoal === goal);
  if ((userStats.totalPoints ?? 0) >= goal && !alreadyAwarded) {
          const newVoucher = {
            code: `GIFT-${goal}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            pointsGoal: goal,
            claimed: false,
          };
          setAwardedVouchers(prev => {
            const updated = [...prev, newVoucher];
            localStorage.setItem(`ew:vouchers:${user?.email}`, JSON.stringify(updated));
            return updated;
          });
          alert(`Congratulations! You've reached ${goal} points and earned a gift voucher: ${newVoucher.code}`);
        }
      };

  if ((userStats.totalPoints ?? 0) > 0) {
        checkAndAwardVoucher(250, "You've reached 250 points!");
        checkAndAwardVoucher(500, "You've reached 500 points!");
      }
    }, [userStats.totalPoints, awardedVouchers, user?.email]);

    const handleClaimVoucher = (code: string) => {
      setAwardedVouchers(prev => {
        const updated = prev.map(v =>
          v.code === code ? { ...v, claimed: true } : v
        );
        localStorage.setItem(`ew:vouchers:${user?.email}`, JSON.stringify(updated));
        return updated;
      });
      alert(`Voucher ${code} claimed! This is a dummy voucher.`);
    };

    useEffect(() => {
      if (!isAuthenticated || !user?.email) return;
      const interval = setInterval(async () => {
        try {
          const [userRes, allRes] = await Promise.all([
            fetch(`/api/items?userEmail=${encodeURIComponent(user.email)}`),
            fetch(`/api/all-items`)
          ]);
          if (userRes.ok) {
            const ud = await userRes.json();
            setItems(Array.isArray(ud) ? ud : []);
          }
            if (allRes.ok) {
            const gd = await allRes.json();
            setAllItems(Array.isArray(gd) ? gd : []);
          }
        } catch (e) {
          // silent
        }
      }, 10000);
      return () => clearInterval(interval);
    }, [isAuthenticated, user?.email]);


 if (authLoading || loading) {
 return (
 <div className="flex items-center justify-center h-screen bg-gray-50">
  <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
 </div>
 );
}

 return (
  <SidebarProvider>
   <div className="min-h-screen w-screen bg-gray-50 flex overflow-x-hidden">
    <AppSidebar />
    <SidebarInset className="flex-1 w-full">
      <DashboardHeader />
      <main className={cn("flex-1 w-full p-4 md:p-6 space-y-8", styles.gradientScroll)}>
        <DashboardTabNav className="mb-4" />

        {/* Gamified Hero Section: Your Eco-Warrior Journey */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-blue-600 to-purple-700 p-8 text-white shadow-2xl md:p-14"
        >
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }} />
          <div className="relative z-10 flex flex-col items-start justify-between md:flex-row md:items-center">
            <div>
              <h1 className="mb-3 text-4xl font-extrabold tracking-tight md:text-6xl">
                Your Eco-Warrior Journey
              </h1>
              <p className="mb-8 text-lg opacity-90 md:text-xl">
                Every item you report helps the planet and unlocks incredible rewards!
              </p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-full bg-white/10 p-6 shadow-inner md:p-8">
              <p className="text-sm font-semibold uppercase tracking-wide opacity-80">Total Eco-Points</p>
              <motion.p
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 180, damping: 15 }}
                className="text-7xl font-bold md:text-8xl drop-shadow-lg"
              >
                {userStats.totalPoints}
              </motion.p>
            </div>
          </div>

          {/* Interactive Progress Visual */}
          <div className="relative z-10 mt-12 rounded-full bg-white/20 p-2 md:mt-16">
            <div className="flex justify-between px-3 text-sm font-semibold opacity-90 mb-3">
              <span>Current: {userStats.totalPoints} pts</span>
              <span>Next Reward at {(userStats.totalPoints ?? 0) < 250 ? 250 : (userStats.totalPoints ?? 0) < 500 ? 500 : '...'} pts!</span>
            </div>
            <div className="h-5 overflow-hidden rounded-full bg-gray-700/50">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-orange-500 shadow-md"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((userStats.totalPoints ?? 0) / ((userStats.totalPoints ?? 0) < 250 ? 250 : (userStats.totalPoints ?? 0) < 500 ? 500 : (userStats.totalPoints ?? 0) + 250)) * 100, 100)}%` }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            </div>
            <div className="mt-4 text-center text-lg font-medium opacity-90">
              {(userStats.totalPoints ?? 0) < 250 ? `Earn ${250 - (userStats.totalPoints ?? 0)} more points for your first voucher!` : "Keep going, Eco-Hero!"}
            </div>
          </div>
        </motion.section>

        {/* Your Eco-Rewards Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-8 md:space-y-10"
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-800 md:text-4xl">Your Eco-Rewards</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[250, 500, 1000, 2000].map(goal => {
              const voucher = awardedVouchers.find(v => v.pointsGoal === goal);
              const isAwarded = !!voucher;
              const isClaimed = voucher?.claimed;
              const canEarn = (userStats.totalPoints ?? 0) >= goal;
              const isNextGoal = !isAwarded && canEarn;
              const progressToGoal = Math.min(((userStats.totalPoints ?? 0) / goal) * 100, 100);

              return (
                <motion.div
                  key={goal}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 + (goal / 250) * 0.05 }}
                  className={cn(
                    "relative flex flex-col items-center justify-between rounded-3xl border p-6 shadow-xl transition-all duration-300 transform hover:scale-[1.03]",
                    isAwarded
                      ? isClaimed
                        ? "border-green-300 bg-green-50 text-green-700 opacity-80"
                        : "border-amber-400 bg-amber-50 text-amber-800 shadow-2xl"
                      : "border-gray-200 bg-gray-100 text-gray-500 opacity-50 cursor-not-allowed",
                    isNextGoal && "ring-4 ring-purple-400 ring-opacity-50"
                  )}
                >
                  {isAwarded && !isClaimed && (
                    <motion.div
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.6 }}
                      className="absolute -top-4 -right-4 rounded-full bg-amber-500 p-3 shadow-lg"
                    >
                      <span className="text-lg font-bold text-white">NEW!</span>
                    </motion.div>
                  )}
                  
                  <div className="mb-4 text-6xl md:text-7xl">
                    {isAwarded ? (isClaimed ? '✅' : '🌟') : '🔒'}
                  </div>
                  
                  <h3 className="mb-2 text-2xl font-bold">Gift Voucher</h3>
                  <p className="text-sm opacity-90">Worth {goal} points!</p>

                  {!isAwarded && (
                    <div className="w-full mt-4">
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-2">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressToGoal}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{Math.round(progressToGoal)}% towards this reward</p>
                    </div>
                  )}

                  {isAwarded ? (
                    isClaimed ? (
                      <p className="mt-4 text-lg font-semibold text-green-600">🎉 Claimed! Code: {voucher.code}</p>
                    ) : (
                      <button
                        onClick={() => handleClaimVoucher(voucher.code)}
                        className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:from-amber-600 hover:to-orange-600 hover:scale-[1.02]"
                      >
                        Claim Your Reward!
                      </button>
                    )
                  ) : (
                    <p className="mt-6 text-base text-gray-500">
                      Earn {goal - (userStats.totalPoints ?? 0)} more points to unlock.
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Department Eco-Leaderboard */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-8 md:space-y-10"
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-800 md:text-4xl">Department Eco-Leaderboard</h2>
          <div className="rounded-3xl border bg-white shadow-xl">
            {scoreboard.length === 0 ? (
              <p className="p-8 text-gray-600 text-lg">No department activity yet. Be the first to report!</p>
            ) : (
              <ul className="divide-y divide-gray-100 p-6">
                {scoreboard.map(([dept, stats], idx) => {
                  const DeptIcon = DEPT_ICONS[dept] || Users;
                  const isTop3 = idx < 3;
                  return (
                    <motion.li
                      key={dept}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 + idx * 0.08 }}
                      className="flex items-center justify-between py-4"
                    >
                      <div className="flex items-center gap-5">
                        {isTop3 && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.4 + idx * 0.08 }}
                          >
                            <Medal className={cn("w-7 h-7",
                              idx === 0 ? "text-amber-500" :
                              idx === 1 ? "text-gray-400" :
                              "text-yellow-700"
                            )} />
                          </motion.div>
                        )}
                        <div className="rounded-full bg-blue-100 p-2">
                          <DeptIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{dept}</p>
                          <p className="text-sm text-muted-foreground">{stats.count} item{stats.count !== 1 && 's'} reported</p>
                        </div>
                      </div>
                      <motion.p
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 + idx * 0.08 }}
                        className="font-extrabold text-xl text-emerald-600"
                      >
                        {stats.points} pts
                      </motion.p>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>
        </motion.section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5"/>
            {error}
          </div>
        )}
      </main>
    </SidebarInset>
   </div>
  </SidebarProvider>
);
}