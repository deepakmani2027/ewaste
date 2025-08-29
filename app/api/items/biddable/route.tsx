import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { ItemSchema } from "@/lib/types";

const Item = mongoose.models.Item || mongoose.model("Item", ItemSchema);

async function connect() {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not defined.");
  await mongoose.connect(mongoUri);
}

export async function GET() {
  try {
    await connect();
    const items = await Item.find({ biddingStatus: "open" }).sort({ biddingEndDate: 1 });
    return NextResponse.json(items, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/items/biddable Error:", e);
    return NextResponse.json({ message: e.message || "Failed to load items." }, { status: 500 });
  }
}
