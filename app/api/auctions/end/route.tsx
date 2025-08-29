import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { ItemSchema } from "@/lib/types";

const Item = mongoose.models.Item || mongoose.model("Item", ItemSchema);

async function connect() {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not defined.");
  await mongoose.connect(mongoUri);
}

export async function POST(req: NextRequest) {
  try {
    await connect();
    const { itemId } = await req.json();
    if (!itemId) {
      return NextResponse.json({ message: "itemId is required" }, { status: 400 });
    }

    const item = await Item.findById(itemId);
    if (!item) return NextResponse.json({ message: "Item not found." }, { status: 404 });

    if (item.biddingStatus !== "open") {
      return NextResponse.json({ message: "Auction already closed or not open." }, { status: 400 });
    }

    item.biddingStatus = "closed";
    await item.save();

    return NextResponse.json({ success: true, message: "Auction closed." }, { status: 200 });
  } catch (e: any) {
    console.error("POST /api/auctions/end Error:", e);
    return NextResponse.json({ message: e.message || "Server error." }, { status: 500 });
  }
}
