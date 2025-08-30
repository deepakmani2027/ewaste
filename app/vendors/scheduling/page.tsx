"use client"

import { useEffect, useState } from "react";
import { useAuth, AuthProvider } from "@/components/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CalendarX, Package, MapPin } from "lucide-react";
import type { Pickup, EwItem } from "@/lib/types";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import DashboardTabNav2 from "@/components/dashboard-tab-nav2";
import { VendorSidebar } from "@/components/vendor-sidebar";
import { useRouter } from "next/navigation";

// The API populates itemIds, so we need a type for the populated data
interface PopulatedPickup extends Omit<Pickup, 'itemIds'> {
  itemIds: Pick<EwItem, '_id' | 'name'>[];
}

export default function SchedulingPageLayout() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pickups, setPickups] = useState<PopulatedPickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Security check and redirection
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    } else if (!authLoading && user?.role !== 'vendor') {
  router.replace("/dashboard"); // Redirect non-vendors to main dashboard
    }
  }, [isAuthenticated, user, authLoading, router]);

  useEffect(() => {
    const fetchPickups = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/pickups?vendorId=${user._id}`);
        if (response.ok) {
          setPickups(await response.json());
        } else {
          throw new Error("Failed to load scheduled pickups.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Fetch data only after auth check is complete and user is a vendor
    if (!authLoading && isAuthenticated && user?.role === 'vendor') {
      fetchPickups();
    }
  }, [user, authLoading, isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <VendorSidebar />
      <div className="flex-1">
        <DashboardHeader />
        <div className="p-4 md:p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Your Scheduled Pickups</h1>
            <p className="text-muted-foreground mt-1">
              Review details for your upcoming e-waste collections.
            </p>
          </header>
          <div className="mb-4">
            <DashboardTabNav2 />
          </div>
          <hr className="mb-3"/>
          {error && <div className="text-red-600 bg-red-100 p-4 rounded-md">{error}</div>}

          {pickups.length === 0 && !error && (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarX size={48} className="mx-auto mb-4"/>
              <h3 className="text-lg font-semibold">No Pickups Scheduled</h3>
              <p>You currently have no scheduled pickups.</p>
            </div>
          )}

          <div className="space-y-6">
            {pickups.map(pickup => (
              <PickupCard key={pickup._id} pickup={pickup} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Pickup Card Component ---
function PickupCard({ pickup }: { pickup: PopulatedPickup }) {
    const notesParts = pickup.notes?.split('\nDelivery Address: ');
    const mainNotes = notesParts?.[0];
    const deliveryAddress = notesParts?.[1];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pickup for {new Date(pickup.date).toDateString()}</CardTitle>
                <div className="text-sm font-medium text-white bg-blue-600 px-3 py-1 rounded-full">
                    {pickup.itemIds.length} Items
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {deliveryAddress && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                        <MapPin className="w-5 h-5 text-gray-500 mt-1"/>
                        <div>
                            <p className="font-semibold">Delivery Address</p>
                            <p className="text-muted-foreground">{deliveryAddress}</p>
                        </div>
                    </div>
                )}
                {mainNotes && (
                    <div>
                        <h4 className="font-semibold mb-2">Notes</h4>
                        <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-md">{mainNotes}</p>
                    </div>
                )}
                <div>
                    <h4 className="font-semibold mb-2">Items to Collect</h4>
                    <ul className="space-y-2">
                        {pickup.itemIds.map(item => (
                            <li key={item._id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-md">
                                <Package size={16} className="text-gray-500"/>
                                <span>{item.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}

// --- Main Page Export ---
