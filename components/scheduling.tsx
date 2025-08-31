"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarX, Package, MapPin, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from "./auth/auth-context"
import type { Pickup, Vendor } from "@/lib/types";

// The API populates itemIds, so we need a type for the populated data
interface PopulatedPickup extends Omit<Pickup, 'itemIds'> {
  itemIds: { _id: string; name: string; pickupAddress?: any }[];
  vendorName: string;
}

// This component is now a read-only view of scheduled pickups.
export default function Scheduling() {
 const { user, isAuthenticated, loading: authLoading } = useAuth();
 const [pickups, setPickups] = useState<PopulatedPickup[]>([]);
   const [vendors, setVendors] = useState<Vendor[]>([]); // kept for potential future use/display
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  const fetchData = async () => {
   if (!user?.email) {
    setLoading(false);
    return;
   }
   try {
    setError(null);
    setLoading(true);
    const response = await fetch(`/api/scheduling?userEmail=${encodeURIComponent(user.email)}`);
    if (!response.ok) {
     throw new Error("Failed to load scheduling data.");
    }
  const data = await response.json();
  // Prefer server-side populated list for performance; fallback if absent
  const populated = data.populatedPickups || [];
  setPickups(populated);
  setVendors(data.vendors || []);
   } catch (err: any) {
    setError(err.message);
   } finally {
    setLoading(false);
   }
  };

    if (!authLoading && isAuthenticated) {
      fetchData();
    } else if (!authLoading) {
        setLoading(false);
    }
 }, [user, isAuthenticated, authLoading]);

 if (loading || authLoading) {
  return <div className="text-center py-12"><Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400"/></div>;
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

 return (
    // --- FIX: The layout is now a single column to better display the list ---
  <div className="w-full max-w-4xl mx-auto">
   <Card>
    <CardHeader>
     <CardTitle>Upcoming Pickups</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
     {pickups.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <CalendarX size={48} className="mx-auto mb-4"/>
                <h3 className="text-xl font-semibold">No Pickups Scheduled</h3>
                <p>Items you schedule for pickup will appear here.</p>
            </div>
     )}
     <div className="space-y-6">
      {pickups.map((p) => {
              // --- FIX: Convert vendor._id to string for reliable comparison ---
       return <PickupCard key={p._id} pickup={p} />;
      })}
     </div>
    </CardContent>
   </Card>
  </div>
 )
}

function PickupCard({ pickup }: { pickup: PopulatedPickup }) {
  
    // Extract final bid from notes if present
    let finalBid = null;
    if (pickup.notes) {
      const match = pickup.notes.match(/Final bid: ?₹?(\d+)/i);
      if (match) finalBid = match[1];
    }
    return (
      <Card className="shadow border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-white/90 hover:shadow-lg hover:border-emerald-400 transition-all duration-200 group p-0 pb-2">
        <CardHeader className="flex flex-row items-center justify-between border-b border-emerald-100 px-3 py-2 bg-gradient-to-r from-emerald-500/90 to-purple-500/80 min-h-0 h-12 rounded-t-xl pt-5">
          <CardTitle className="text-base text-white font-semibold truncate drop-shadow-sm">{pickup.vendorName || "Unknown Vendor"}</CardTitle>
          <Badge className="bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{new Date(pickup.date).toLocaleDateString()}</Badge>
        </CardHeader>
        <CardContent className="px-3 py-2 space-y-2" style={{ minHeight: 120 }}>
          {/* Note Section */}
          <div className="flex items-center gap-2">
            <span className="inline-block bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full text-xs shadow-sm truncate max-w-[60%]">
              {pickup.notes ? pickup.notes : "Pickup for auction winner."}
            </span>
            {finalBid && (
              <span className="inline-block bg-yellow-100 text-yellow-800 font-medium px-2 py-0.5 rounded-full text-xs shadow-sm">
                Final bid: ₹{finalBid}
              </span>
            )}
          </div>
          {/* Items to Collect with Location */}
          <div>
            <h4 className="font-medium mb-1 text-emerald-700 flex items-center gap-1 text-sm">
              <Package size={15} className="text-emerald-500" /> Items to Collect
            </h4>
            <ul className="space-y-1">
              {pickup.itemIds.map((item, idx) => (
                <li key={item._id || idx} className="flex items-center gap-1 text-sm font-normal p-1 bg-emerald-50 rounded border border-emerald-100 shadow-sm">
                  <span className="inline-flex items-center gap-1">
                    <Package size={13} className="text-emerald-400"/>
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
            {/* Show pickup.location: prefer pickup.address (copied at creation) fallback to first item's pickupAddress */}
            {(() => {
              if (pickup.address) {
                return (
                  <div className="mt-2 flex items-center gap-1 p-2 bg-purple-50 border border-purple-200 rounded shadow-sm text-xs">
                    <MapPin size={14} className="text-purple-500" />
                    <span className="font-medium text-purple-700">Pickup Location:</span>
                    <span className="text-purple-800 font-normal">{pickup.address}{pickup.landmark ? ` (${pickup.landmark})` : ''}</span>
                  </div>
                );
              }
              const firstItem: any = pickup.itemIds[0];
              const pickupAddress = firstItem?.pickupAddress;
              if (pickupAddress?.address) {
                return (
                  <div className="mt-2 flex items-center gap-1 p-2 bg-purple-50 border border-purple-200 rounded shadow-sm text-xs">
                    <MapPin size={14} className="text-purple-500" />
                    <span className="font-medium text-purple-700">Pickup Location:</span>
                    <span className="text-purple-800 font-normal">{pickupAddress.address}{pickupAddress.landmark ? ` (${pickupAddress.landmark})` : ''}</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </CardContent>
      </Card>
    )
  }
