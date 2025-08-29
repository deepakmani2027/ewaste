"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, QrCode, Gavel, CalendarDays, Trash2, Loader2 } from 'lucide-react'
import QRCode from "qrcode";
import type { EwItem, Vendor, Pickup, Bid, User } from "@/lib/types";
// Helper to fetch all bids for given item IDs
async function fetchBidsForItems(itemIds: string[]): Promise<Bid[]> {
  if (!itemIds.length) return [];
  const res = await fetch(`/api/bids?itemIds=${itemIds.join(",")}`);
  if (!res.ok) return [];
  return res.json();
}
import { useAuth } from "./auth/auth-context"
import { PickupAddressDialog } from "./pickup-address-dialog";

export default function ItemTable({
  items = [],
  vendors = [],
  onUpdate,
  onScheduleQuick,
  onDelete,
}: {
  items: EwItem[];
  vendors: Vendor[];
  onUpdate: (item: EwItem) => Promise<void> | void;
  onScheduleQuick: (pickup: Omit<Pickup, '_id' | 'id' | 'createdBy'>) => void;
  onDelete: (id: string) => void;
}) {
  const { user } = useAuth();
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [selectedItemForQr, setSelectedItemForQr] = useState<EwItem | null>(null);
  const [qrcodeDataURL, setQrcodeDataURL] = useState<string | null>(null);
  const [isEndingAuction, setIsEndingAuction] = useState<string | null>(null);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [itemForAddress, setItemForAddress] = useState<EwItem | null>(null);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);

  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [classFilter, setClassFilter] = useState<string>("All");

  // Store all bids for items
  const [bids, setBids] = useState<Bid[]>([]);
  const [additionalUsers, setAdditionalUsers] = useState<User[]>([]);

  useEffect(() => {
    // Fetch all bids for the listed items
    const fetchBids = async () => {
      const itemIds = items.map(i => i._id);
      if (itemIds.length === 0) return;
      try {
        const res = await fetch(`/api/bids?itemIds=${itemIds.join(",")}`);
        if (res.ok) {
          setBids(await res.json());
        }
      } catch {}
    };
    fetchBids();
  }, [items]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return items
      .filter((i) => (deptFilter === "All" ? true : i.department === deptFilter))
      .filter((i) => (classFilter === "All" ? true : i.classification?.type === classFilter))
      .filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          i.category.toLowerCase().includes(s) ||
          i.department.toLowerCase().includes(s) ||
          i._id.toLowerCase().includes(s)
      )
      .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
  }, [items, search, sortAsc, deptFilter, classFilter]);

  useEffect(() => {
    const fetchMissingVendors = async () => {
      const knownVendorIds = new Set([
        ...vendors.map(v => v._id),
        ...additionalUsers.map(v => v._id)
      ]);
      const missingVendorIdsToFetch = filtered
        .filter(item => item.winningBidderId && !knownVendorIds.has(item.winningBidderId))
        .map(item => item.winningBidderId!);

      if (missingVendorIdsToFetch.length > 0) {
        // Fetch unique missing vendor IDs
        const uniqueMissingVendorIds = Array.from(new Set(missingVendorIdsToFetch));
        const fetchedUsers: User[] = [];
        for (const userId of uniqueMissingVendorIds) {
          try {
            const res = await fetch(`/api/users?id=${userId}`);
            if (res.ok) {
              const user = await res.json();
              fetchedUsers.push(user);
            }
          } catch (error) {
            console.error(`Failed to fetch user ${userId}:`, error);
          }
        }
        setAdditionalUsers(prev => [...prev, ...fetchedUsers]);
      }
    };

    fetchMissingVendors();
  }, [filtered, vendors, additionalUsers]);

  const allBidders = useMemo(() => {
    const combinedBidders: Array<Vendor | User> = [...vendors, ...additionalUsers];
    return combinedBidders;
  }, [vendors, additionalUsers]);

  // 🔔 Listen for bid updates from VendorItemsPage (BroadcastChannel or window event)
  useEffect(() => {
    let bc: BroadcastChannel | undefined;
    try {
      // @ts-ignore
      if (typeof BroadcastChannel !== "undefined") {
        // @ts-ignore
        bc = new BroadcastChannel("ew-bids");
        bc.onmessage = (ev: MessageEvent) => {
          if (ev?.data?.type === "bid-updated") {
            // simplest guaranteed refresh
            window.location.reload();
          }
        };
      }
    } catch {}

    const handler = (e: Event) => {
      // Fallback custom event
      window.location.reload();
    };
    window.addEventListener("ew-bids" as any, handler);

    return () => {
      if (bc) try { bc.close(); } catch {}
      window.removeEventListener("ew-bids" as any, handler);
    };
  }, []);

  const handleShowQr = async (item: EwItem) => {
    const qrText = `ITEM: ${item.name}\nID: ${item._id}\nDEPT: ${item.department}\nCATEGORY: ${item.category}\nSTATUS: ${item.status}`;
    const url = await QRCode.toDataURL(qrText, { width: 512, margin: 2 });
    setQrcodeDataURL(url);
    setSelectedItemForQr(item);
    setIsQrDialogOpen(true);
  };

  const handleEndAuction = async (item: EwItem) => {
    if (
      window.confirm(
        `Are you sure you want to end the auction for "${item.name}"? This will finalize the winning bidder.`
      )
    ) {
      setIsEndingAuction(item._id);
      try {
        const response = await fetch('/api/auctions/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: item._id, userEmail: user?.email }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to end auction.");
        }

        // On successful auction end, open the address dialog
        setItemForAddress(item);
        setIsAddressDialogOpen(true);
        // No onUpdate here yet, it will happen after address submission
      } catch (error: any) {
        console.error("End Auction Error:", error);
        alert(`Error: ${error.message}`);
      } finally {
        setIsEndingAuction(null);
      }
    }
  };

  function quickSchedule(item: EwItem) {
    if (!allBidders || allBidders.length === 0) {
      alert("No bidders are available to schedule a pickup. Please add a vendor or user.");
      return;
    }
    const winningBidder = allBidders.find((b) => b._id === item.winningBidderId);
    if (!winningBidder) {
      alert("Could not find the winning bidder to schedule a pickup.");
      return;
    }

    // Determine the ID to use for vendorId in Pickup payload
    let pickupVendorId: string;
    if ('role' in winningBidder && winningBidder.role === 'vendor') {
      pickupVendorId = winningBidder._id; // It's a User with vendor role
    } else if (!('role' in winningBidder)) {
      pickupVendorId = winningBidder._id; // It's a Vendor
    } else {
      alert("Winning bidder is not a vendor or a user with a vendor role. Cannot schedule pickup.");
      return;
    }

    const pickupPayload: Omit<Pickup, '_id' | 'id' | 'createdBy'> = {
      date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      vendorId: pickupVendorId,
      itemIds: [item._id],
      notes: `Pickup for auction winner. Final bid: ₹${item.currentHighestBid}`,
    };
    onScheduleQuick(pickupPayload);
  }

  const handleAddressSubmit = async (
    address: string,
    lat: number,
    lng: number
  ) => {
    if (!itemForAddress) return; // Should not happen
    setIsSubmittingAddress(true);
    try {
      // Here we would make an API call to update the item with the pickup address or create a pickup
      const response = await fetch('/api/pickups/update-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: itemForAddress._id, address, landmark: "", lat, lng }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update pickup address.");
      }

      setIsAddressDialogOpen(false);
      await onUpdate(itemForAddress); // Refresh parent after successful address submission
    } catch (error: any) {
      console.error("Address submission error:", error);
      alert(`Error submitting address: ${error.message}`);
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  return (
    <Card className="overflow-hidden mt-4">
      <CardHeader className="pb-2">
        <CardTitle>My Listed Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-12 gap-4 items-end">
          {/* your filter UI here (omitted for brevity) */}
        </div>

        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[56px]">QR</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Highest Bid</TableHead>
                <TableHead>Top Bidder</TableHead>
                <TableHead>Auction Ends</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((it) => {
                // Find all bids for this item
                const itemBids = bids.filter(b => b.itemId === it._id);
                // Find the highest bid for this item
                let topBid: Bid | undefined = undefined;
                if (itemBids.length > 0) {
                  topBid = itemBids.reduce((max, b) => b.bidAmount > max.bidAmount ? b : max, itemBids[0]);
                }
                // Find the vendor for the top bid
                const winningBidder = allBidders.find(v => v._id === it.winningBidderId);

                return (
                  <TableRow key={it._id}>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => handleShowQr(it)}>
                        <QrCode className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{it.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={it.biddingStatus === 'open' ? 'default' : 'secondary'}
                        className={it.biddingStatus === 'open' ? 'bg-green-600' : ''}
                      >
                        {it.biddingStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {it.biddingStatus !== 'draft' ? `₹${it.currentHighestBid}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {it.winningBidderId
                        ? winningBidder?.name || 'Bidder data missing'
                        : 'No bids yet'}
                    </TableCell>
                    <TableCell>
                      {it.biddingEndDate ? new Date(it.biddingEndDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {it.biddingStatus === 'open' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleEndAuction(it)}
                            disabled={isEndingAuction === it._id}
                          >
                            {isEndingAuction === it._id
                              ? <Loader2 className="w-4 h-4 animate-spin"/>
                              : <>
                                  <Gavel className="w-4 h-4 mr-2"/>
                                  End Auction
                                </>
                            }
                          </Button>
                        )}
                        {it.biddingStatus === 'closed' && it.winningBidderId && it.status === 'Reported' && (
                          <Button variant="secondary" size="sm" onClick={() => quickSchedule(it)}>
                            <CalendarDays className="w-4 h-4 mr-2"/>
                            Schedule Pickup
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => { if (confirm("Delete this item permanently?")) { onDelete(it._id) } }}
                        >
                          <Trash2 className="w-4 h-4"/>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">No items found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="w-[520px] max-w-[92vw]">
          <DialogHeader><DialogTitle>QR Code & Product Details</DialogTitle></DialogHeader>
          {selectedItemForQr && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center justify-center gap-3 self-center">
                <Image src={qrcodeDataURL || ""} alt="QR Code" width={220} height={220} className="rounded-md border"/>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (!qrcodeDataURL) return;
                    const a = document.createElement("a");
                    a.href = qrcodeDataURL;
                    a.download = `${selectedItemForQr._id}-qr.png`;
                    a.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </div>
              <div className="border-t pt-4 grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">ID:</span><span className="font-semibold">{selectedItemForQr._id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span className="font-medium">{selectedItemForQr.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Category:</span><span>{selectedItemForQr.category}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Department:</span><span>{selectedItemForQr.department}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><span>{selectedItemForQr.status}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PickupAddressDialog
        open={isAddressDialogOpen}
        onOpenChange={setIsAddressDialogOpen}
        onAddressSubmit={handleAddressSubmit}
        loading={isSubmittingAddress}
      />
    </Card>
  )
}
