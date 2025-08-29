"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { EwItem, Vendor, Pickup } from "@/lib/types";
import { Download, AlertTriangle } from 'lucide-react'
import { useAuth } from "./auth/auth-context"

// This component is now self-sufficient and fetches its own data.
export default function ComplianceReport() {
  const { user } = useAuth();
  const [items, setItems] = useState<EwItem[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching Logic ---
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      try {
        setError(null);
        setLoading(true);
        const response = await fetch(`/api/compliance?userEmail=${encodeURIComponent(user.email)}`);
        if (!response.ok) {
          throw new Error("Failed to load compliance data.");
        }
        const data = await response.json();
        setItems(data.items || []);
        setPickups(data.pickups || []);
        setVendors(data.vendors || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const summary = useMemo(() => {
    const total = items.length
    const byClass: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    const byDept: Record<string, number> = {}
    const withPickup = items.filter((i) => i.pickupId).length
    const hazardous = items.filter((i) => i.classification?.type === "Hazardous").length
    items.forEach((i) => {
      if (i.classification) {
        byClass[i.classification.type] = (byClass[i.classification.type] || 0) + 1
      }
      byCategory[i.category] = (byCategory[i.category] || 0) + 1
      byDept[i.department] = (byDept[i.department] || 0) + 1
    })
    const certifiedPickups = pickups.filter((p) => vendors.find((v) => v._id === p.vendorId && v.certified))
    return {
      total, byClass, byCategory, byDept, withPickup, hazardous,
      certifiedPickupCount: certifiedPickups.length,
    }
  }, [items, pickups, vendors])

  function exportComplianceCSV() {
    // Generate CSV in the format shown in the screenshot
    const rows: string[] = [];
    rows.push('Section,Key,Value');
    // Summary
    rows.push('Summary,Total Items,' + summary.total);
    rows.push('Summary,Items with Pickups,' + summary.withPickup);
    rows.push('Summary,Certified Pickups,' + summary.certifiedPickupCount);
    rows.push('Summary,Hazardous Items,' + summary.hazardous);
    rows.push(',,');
    // By Class
    rows.push('By Class,Type,Count');
    Object.entries(summary.byClass).forEach(([type, count]) => {
      rows.push(`Class,${type},${count}`);
    });
    rows.push(',,');
    // By Category
    rows.push('By Category,Type,Count');
    Object.entries(summary.byCategory).forEach(([type, count]) => {
      rows.push(`Category,${type},${count}`);
    });
    rows.push(',,');
    // By Department
    rows.push('By Department,Dept,Count');
    Object.entries(summary.byDept).forEach(([dept, count]) => {
      rows.push(`Department,${dept},${count}`);
    });
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compliance-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  
  if (loading) {
    return <div className="text-center py-12">Loading compliance report...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
        <h3 className="text-lg font-medium mb-2">Could not load report</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr] mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Compliance Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Total Items" value={summary.total} />
            <Stat label="Hazardous" value={summary.hazardous} badgeClass="bg-rose-100 text-rose-700" />
            <Stat label="With Pickups" value={summary.withPickup} />
            <Stat label="Certified Pickups" value={summary.certifiedPickupCount} />
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium mb-1">CPCB & E‑Waste Rules Traceability</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Item-level tagging with QR and unique IDs</li>
              <li>Recorded movement: Reported → Scheduled → Collected → Recycled/Disposed</li>
              <li>Vendor certification status tracked</li>
              <li>Department-wise inventory distribution and hazardous segregation</li>
            </ul>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 text-white border-0"
            onClick={exportComplianceCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <p className="text-sm font-medium mb-2">By Classification</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byClass).map(([k, v]) => (
                <Badge key={k} variant="outline">{k}: {v}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">By Category</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byCategory).map(([k, v]) => (
                <Badge key={k} variant="secondary">{k}: {v}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">By Department</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byDept).map(([k, v]) => (
                <Badge key={k} variant="outline">{k}: {v}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value, badgeClass }: { label: string; value: number; badgeClass?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  )
}
