"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-context";
import DashboardHeader from "@/components/dashboard-header";
import { VendorSidebar } from "@/components/vendor-sidebar";
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2, Package, Gavel, Tag, Clock, Wrench, History, ShieldAlert, Recycle,
} from "lucide-react";
import type { EwItem } from "@/lib/types";
import Image from "next/image";
import DashboardTabNav2 from "@/components/dashboard-tab-nav2";

/** Normalize any id-ish value to a string */
function toIdString(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null) {
    // @ts-ignore
    if (typeof (raw as any).toHexString === "function") return (raw as any).toHexString();
    if (typeof (raw as any).toString === "function") {
      const s = (raw as any).toString();
      if (s && s !== "[object Object]") return s;
    }
    if ("buffer" in (raw as any)) {
      const bytes = Object.values((raw as any).buffer) as number[];
      const hex = bytes.map((b) => Number(b).toString(16).padStart(2, "0")).join("");
      return hex || undefined;
    }
  }
  return undefined;
}

export default function VendorItemsPage() {
  const { user } = useAuth();
  const vendorIdStr = toIdString((user as any)?.id ?? (user as any)?._id);

  const [items, setItems] = useState<EwItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<EwItem | null>(null);
  const [isBidDialogOpen, setIsBidDialogOpen] = useState(false);

  const fetchBiddableItems = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      setError(null);
      const response = await fetch("/api/items/biddable");
      if (!response.ok) throw new Error("Failed to load available items.");
      setItems(await response.json());
    } catch (err: any) {
      setError(err.message || "Failed to load items.");
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBiddableItems(false);
    const intervalId = setInterval(() => fetchBiddableItems(true), 10000);
    return () => clearInterval(intervalId);
  }, [fetchBiddableItems]);

  const handleBidClick = (item: EwItem) => {
    setSelectedItem(item);
    setIsBidDialogOpen(true);
  };

  const handleBidPlaced = (itemIdJustBid: string) => {
    setIsBidDialogOpen(false);
    fetchBiddableItems(false);

    // 🔊 Broadcast to other open tabs/pages (e.g., dashboard with ItemTable)
    try {
      // @ts-ignore
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("ew-bids");
        bc.postMessage({ type: "bid-updated", itemId: itemIdJustBid, ts: Date.now() });
        bc.close();
      }
    } catch {}
    // Fallback custom event (same tab listeners)
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("ew-bids", { detail: { itemId: itemIdJustBid } }));
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <Loader2 className="w-12 h-12 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <VendorSidebar />
      <div className="flex-1">
        <DashboardHeader />
        <div className="p-4 md:p-6">
          <header className="mb-8 ml-3">
            <h1 className="text-3xl font-bold tracking-tight">Auction Marketplace</h1>
            <p className="text-muted-foreground mt-1">Browse and bid on available e-waste items.</p>
          </header>
          <div className="mb-4">
            <DashboardTabNav2 />
          </div>
          <hr className="mb-3"/>
          {error && <div className="text-red-600 bg-red-100 p-4 rounded-md">{error}</div>}

          {items.length === 0 && !error && (
            <div className="text-center py-12 text-muted-foreground">
              <Package size={48} className="mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Items Available for Bidding</h3>
              <p>Please check back later for new auction items.</p>
            </div>
          )}

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <BiddingCard key={String(item._id)} item={item} onBidClick={() => handleBidClick(item)} />
            ))}
          </div>

          {selectedItem && (
            <BidDialog
              open={isBidDialogOpen}
              onOpenChange={setIsBidDialogOpen}
              item={selectedItem}
              vendorId={vendorIdStr}
              onBidPlaced={handleBidPlaced}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function BiddingCard({ item, onBidClick }: { item: EwItem; onBidClick: () => void }) {
  const timeLeft = () => {
    const diff = new Date(item.biddingEndDate).getTime() - Date.now();
    if (diff <= 0) return "Auction ended";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return `${days}d ${hours}h left`;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Image
          src={`https://placehold.co/600x400/e2e8f0/64748b?text=${encodeURIComponent(item.category || 'Undefined')}`}
          alt={item.name || 'Item'}
          width={600}
          height={400}
          className="rounded-lg"
        />
        <CardTitle className="pt-4">{item.name || 'Item'}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <Tag size={14} className="mr-2" /> Current Bid:
          <span className="font-semibold text-foreground ml-1">₹{item.currentHighestBid}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock size={14} className="mr-2" /> {timeLeft()}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Wrench size={14} className="mr-2" /> Condition:
          <span className="font-semibold text-foreground ml-1">{item.condition}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <History size={14} className="mr-2" /> Age:
          <span className="font-semibold text-foreground ml-1">{item.ageMonths} months</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          {item.classification?.type === "Hazardous" ? (
            <ShieldAlert size={14} className="mr-2 text-red-500" />
          ) : (
            <Recycle size={14} className="mr-2 text-green-500" />
          )}
          Classification:
          <span className="font-semibold text-foreground ml-1">
            {item.classification?.type || "N/A"}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onBidClick}>
          <Gavel size={16} className="mr-2" /> Place Bid
        </Button>
      </CardFooter>
    </Card>
  );
}

function BidDialog({
  open,
  onOpenChange,
  item,
  vendorId,
  onBidPlaced,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: EwItem;
  vendorId?: string;
  onBidPlaced: (itemId: string) => void;
}) {
  const [bidAmount, setBidAmount] = useState("");
  const [isBidding, setIsBidding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitBid = async () => {
    if (!vendorId) {
      setError("You must be logged in as a vendor to bid.");
      return;
    }
    if (Number(bidAmount) <= item.currentHighestBid) {
      setError(`Your bid must be higher than ₹${item.currentHighestBid}.`);
      return;
    }

    setIsBidding(true);
    setError(null);

    try {
      const payload = {
        itemId: String(item._id),
        vendorId, // ✅ clean string
        bidAmount: Number(bidAmount),
      };

      const response = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to place bid.");

      // 🔄 local close + refresh + broadcast
      onBidPlaced(String(item._id));
    } catch (err: any) {
      setError(err.message || "Failed to place bid.");
    } finally {
      setIsBidding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place a Bid on: {item.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm">
            The current highest bid is{" "}
            <span className="font-bold">₹{item.currentHighestBid}</span>. Your bid must be higher.
          </p>
          <div className="space-y-2">
            <Label htmlFor="bid-amount">Your Bid (₹)</Label>
            <Input
              id="bid-amount"
              type="number"
              placeholder={`e.g., ${item.currentHighestBid + 50}`}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleSubmitBid} disabled={isBidding} className="w-full">
            {isBidding ? <Loader2 className="animate-spin mr-2" /> : <Gavel size={16} className="mr-2" />}
            {isBidding ? "Placing Bid..." : "Submit Bid"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
