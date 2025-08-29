"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Download } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from "@/components/auth/auth-context"

// Central dashboard tab navigation used across dashboard sub-pages
export function DashboardTabNav2({ className }: { className?: string }) {
  const pathname = usePathname();
  const tabs = [
    { key: 'Dashboard',       label: 'Dashboard',       emoji: '📦', href: '/vendors/dashboard',      activeClasses: 'from-purple-500 to-violet-600', hoverFrom: 'from-purple-50',  hoverTo: 'to-violet-50' },
    { key: 'items',       label: 'Items',       emoji: '📦', href: '/vendors/items',       activeClasses: 'from-emerald-500 to-teal-600',   hoverFrom: 'from-emerald-50', hoverTo: 'to-teal-50' },
    { key: 'Pickup',  label: 'Pickup',  emoji: '📅', href: '/vendors/scheduling',  activeClasses: 'from-blue-500 to-indigo-600',    hoverFrom: 'from-blue-50',    hoverTo: 'to-indigo-50' },
    { key: 'Profile',  label: 'Profile',  emoji: '🛡️', href: '/vendors/profile',  activeClasses: 'from-amber-500 to-orange-600',  hoverFrom: 'from-amber-50',   hoverTo: 'to-orange-50' },
    
  ];
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!user?.email || exporting) return;
    try {
      setExporting(true);
      const res = await fetch(`/api/items?userEmail=${encodeURIComponent(user.email)}`);
      if (!res.ok) throw new Error('Failed to fetch items');
      const data = await res.json();
      // Normalize item to ensure all fields exist and match the MongoDB-style format
      function normalizeExportItem(item: any) {
        return {
          _id: item._id || '',
          name: item.name || '',
          department: item.department || '',
          category: item.category || '',
          ageMonths: typeof item.ageMonths === 'number' ? item.ageMonths : '',
          condition: item.condition || '',
          classification: { type: item?.classification?.type || '' },
          status: item.status || '',
          createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : '',
        };
      }
      const fields = ['_id','name','department','category','ageMonths','condition','classification.type','status','createdAt'];
      const header = fields.join(',');
      const rows = Array.isArray(data) ? data.map((item: any) => {
        const n = normalizeExportItem(item);
        const values = [
          n._id,
          n.name,
          n.department,
          n.category,
          n.ageMonths,
          n.condition,
          n.classification.type,
          n.status,
          n.createdAt,
        ];
        return values.map(v => {
          const s = (v ?? '').toString();
          if (/[",\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
          return s;
        }).join(',');
      }) : [];
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'items-export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className={cn('w-full mb-4 px-2 md:px-4', className)}>
      <div className="w-full flex flex-col md:flex-row md:justify-between gap-4">
        {/* Box 1: Tabs */}
        <div className="w-full md:w-auto">
          <div className="inline-flex rounded-2xl shadow-lg border border-gray-100 bg-white/90 p-2 max-w-full overflow-hidden">
            <nav className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-green-500 whitespace-nowrap gap-2 w-full max-w-[320px] md:max-w-none mx-auto">
              {tabs.map(tab => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.key}
                    href={tab.href}
                    className={cn(
                      'relative overflow-hidden rounded-xl px-3 py-3 font-semibold text-sm transition-all duration-300 flex items-center justify-center min-w-[100px] flex-shrink-0',
                      !isActive && 'hover:bg-gradient-to-r',
                      !isActive && tab.hoverFrom,
                      !isActive && tab.hoverTo,
                      isActive && 'bg-gradient-to-r text-white shadow-xl',
                      isActive && tab.activeClasses
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="relative z-10 truncate">{tab.emoji} {tab.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
export default DashboardTabNav2