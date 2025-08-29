"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Phone, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useStaggeredAnimation } from "@/hooks/use-scroll-animation"
import type { Vendor } from "@/lib/types"

// This component now displays a read-only list of users with the 'vendor' role.
export default function Vendors() {
 const [vendors, setVendors] = useState<Vendor[]>([])
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 const { ref: overviewRef, visibleItems: visibleOverview } = useStaggeredAnimation(3, 150)

 useEffect(() => {
    const fetchVendors = async () => {
      try {
       setError(null);
       setLoading(true);
          // --- FIX: Fetching from the correct API endpoint for users with role 'vendor' ---
       const response = await fetch('/api/users?role=vendor');
       if (!response.ok) {
        throw new Error("Failed to fetch vendors. Please try again later.");
       }
       const data = await response.json();
       setVendors(data);
      } catch (err: any) {
       console.error("Error fetching vendors:", err);
       setError(err.message);
      } finally {
       setLoading(false);
      }
     };
  fetchVendors();
 }, []);

  // --- FIX: All handler functions for adding, editing, and deleting have been removed ---

 return (
  <div className="space-y-6">
   {/* Vendors Overview Cards */}
   <div 
    ref={overviewRef as any}
    className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-3"
   >
    {[
     { title: "Total Vendors", value: vendors.length, icon: <Building2 className="h-8 w-8 opacity-80" />, gradient: "from-blue-500 to-blue-600" },
     { title: "Certified", value: vendors.filter(v => v.certified).length, icon: <CheckCircle className="h-8 w-8 opacity-80" />, gradient: "from-green-500 to-green-600" },
     { title: "Unverified", value: vendors.filter(v => !v.certified).length, icon: <XCircle className="h-8 w-8 opacity-80" />, gradient: "from-orange-500 to-orange-600" }
    ].map((card, index) => (
     <Card 
      key={card.title}
      className={`bg-gradient-to-br ${card.gradient} text-white border-0 transition-all duration-500 ease-out ${
       visibleOverview.includes(index)
        ? 'opacity-100 translate-y-0 scale-100'
        : 'opacity-0 translate-y-6 scale-95'
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
     >
      <CardContent className="p-4">
       <div className="flex items-center justify-between">
        <div>
         <p className="text-sm opacity-90">{card.title}</p>
         <p className="text-2xl font-bold">{card.value}</p>
        </div>
        {card.icon}
       </div>
      </CardContent>
     </Card>
    ))}
   </div>

   {/* Vendors List Section */}
   <Card>
    <CardContent className="p-4 md:p-6">
          {/* --- FIX: Removed the "Add Vendor" button and simplified the header --- */}
     <div className="mb-6">
      <div>
       <h3 className="text-xl font-semibold">Registered Vendors</h3>
       <p className="text-sm text-muted-foreground mt-1">
        A list of all registered e-waste collection and recycling partners.
       </p>
      </div>
     </div>

     {loading && <div className="text-center py-12 text-muted-foreground">Loading vendors...</div>}
     
     {error && (
      <div className="text-center py-12 text-red-600">
       <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
       <h3 className="text-lg font-medium mb-2">Could not load vendors</h3>
       <p className="text-sm">{error}</p>
      </div>
     )}

     {!loading && !error && vendors.length === 0 && (
      <div className="text-center py-12">
       <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
       <h3 className="text-lg font-medium text-muted-foreground mb-2">No vendors registered</h3>
       <p className="text-sm text-muted-foreground">Users who register as vendors will appear here.</p>
      </div>
     )}

     {!loading && !error && vendors.length > 0 && (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in-0 duration-500">
       {vendors.map((vendor) => (
        <Card key={vendor._id} className="transition-shadow">
         <CardContent className="p-4">
          <div className="flex items-start justify-between">
           <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base truncate">{vendor.name}</h4>
            <div className="flex items-center gap-1 mt-1">
             <Phone className="h-3 w-3 text-muted-foreground" />
             <p className="text-sm text-muted-foreground truncate">{vendor.contact}</p>
            </div>
           </div>
           <Badge 
            variant={vendor.certified ? "default" : "outline"}
            className={vendor.certified ? "bg-green-500" : ""}
           >
            {vendor.certified ? "Certified" : "Unverified"}
           </Badge>
          </div>
                      {/* --- FIX: Action buttons have been removed --- */}
         </CardContent>
        </Card>
       ))}
      </div>
     )}
    </CardContent>
   </Card>
  </div>
 )
}
