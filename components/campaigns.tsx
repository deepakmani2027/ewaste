"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { EwItem } from "@/lib/types"
import { Gift, Medal, Cpu, FlaskConical, BookOpen, Building2, Home, Users, AlertTriangle } from 'lucide-react'
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { useAuth } from "@/components/auth/auth-context"

type Dept = EwItem["department"]

const DEPT_ICONS: Record<Dept, any> = {
  Engineering: Cpu,
  Sciences: FlaskConical,
  Humanities: BookOpen,
  Administration: Building2,
  Hostel: Home,
  Other: Users,
}

export default function Campaigns() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [items, setItems] = useState<EwItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false)

  const { ref: challengeRef, isInView: challengeInView } = useScrollAnimation()
  const { ref: scoreboardRef, isInView: scoreboardInView } = useScrollAnimation()
  // --- FIX: Removed the faulty useStaggeredAnimation hook ---

  useEffect(() => {
    const fetchItems = async () => {
      if (!user?.email) {
        setItems([]);
        setLoading(false);
        return;
      }
      try {
        setError(null);
        setLoading(true);
        const response = await fetch(`/api/items?userEmail=${encodeURIComponent(user.email)}`);
        if (!response.ok) {
          throw new Error("Failed to load campaign data.");
        }
        const data = await response.json();
        setItems(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (isAuthenticated) {
        fetchItems();
      } else {
        setLoading(false);
      }
    }
  }, [user, isAuthenticated, authLoading]);
  
  const userStats = useMemo(() => {
    const totalItems = items.length
    const points = totalItems * 10
    const recentItems = items.filter(item => {
      const itemDate = new Date(item.createdAt)
      const daysDiff = (Date.now() - itemDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff <= 7
    })
    const weeklyBonus = recentItems.length * 5
    
    return {
      totalPoints: points + weeklyBonus,
      itemsReported: totalItems,
      progress: Math.min((points + weeklyBonus) / 100 * 100, 100)
    }
  }, [items])

  const scoreboard = useMemo(() => {
    const byDept: Record<Dept, { count: number; points: number }> = {
      Engineering: { count: 0, points: 0 },
      Sciences: { count: 0, points: 0 },
      Humanities: { count: 0, points: 0 },
      Administration: { count: 0, points: 0 },
      Hostel: { count: 0, points: 0 },
      Other: { count: 0, points: 0 },
    }
    
    items.forEach((i) => {
      if (i.classification) {
        byDept[i.department].count++
        if (i.classification.type === "Hazardous") byDept[i.department].points += 20
        else if (i.classification.type === "Reusable") byDept[i.department].points += 15
        else if (i.classification.type === "Recyclable") byDept[i.department].points += 10
      }
    })
    
    const entries = Object.entries(byDept) as [Dept, { count: number; points: number }][]
    return entries
      .filter(([, stats]) => stats.count > 0)
      .sort((a, b) => b[1].points - a[1].points)
  }, [items])

  if (authLoading || loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading campaigns...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
        <h3 className="text-lg font-medium mb-2">Could not load data</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // The parent page handles the redirect
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <Card 
        ref={challengeRef as any}
        className={`transition-all duration-700 ease-out ${
          challengeInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <CardHeader>
          <CardTitle>Green Challenge — Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Report e‑waste from your lab or department. Earn points for each verified item and climb the green scoreboard!
          </p>
          <div className="rounded-xl p-4 text-white bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500">
            <p className="text-sm opacity-90">Current Reward Pool</p>
            <p className="text-2xl font-semibold">Campus Tree Drive</p>
            <p className="text-sm opacity-90">Top 3 departments win a sponsored sapling plantation drive.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Your Points</p>
              <p className="text-2xl font-semibold mt-1">{userStats.totalPoints}</p>
              <Progress value={userStats.progress} className="mt-2" />
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Goal</p>
              <p className="text-2xl font-semibold mt-1">100</p>
              <p className="text-xs text-muted-foreground mt-1">Earn by reporting real items</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              className="bg-gradient-to-r from-emerald-500 to-purple-600 text-white"
              onClick={() => setJoined(true)}
              disabled={joined}
            >
              <Gift className="w-4 h-4 mr-2" />
              {joined ? "✅ Joined!" : "🚀 Join Challenge"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => alert(`You have ${userStats.totalPoints} real points from ${userStats.itemsReported} items! Report more items to earn points.`)}
            >
              📊 View Real Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card 
        ref={scoreboardRef as any}
        className={`transition-all duration-700 ease-out ${
          scoreboardInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: '200ms' }}
      >
        <CardHeader>
          <CardTitle>Department Scoreboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scoreboard.map(([dept, stats], idx) => {
            const DeptIcon = DEPT_ICONS[dept]
            return (
              // --- FIX: Replaced complex ref callback with simple, reliable animation classes ---
              <div
                key={dept}
                className="flex items-center justify-between p-3 rounded-lg border animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {idx < 3 ? <Medal className="w-4 h-4 text-amber-500" /> : <span className="w-4 h-4" />}
                    <DeptIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{dept}</p>
                    <p className="text-xs text-muted-foreground">{stats.count} items</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-emerald-600">{stats.points} pts</p>
                  <p className="text-xs text-muted-foreground">#{idx + 1}</p>
                </div>
              </div>
            )
          })}
          {scoreboard.length === 0 && <p className="text-sm text-muted-foreground">No data yet. Report items to get on the scoreboard!</p>}
        </CardContent>
      </Card>
    </div>
  )
}
