import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
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
    const { itemId, address, landmark, lat, lng } = await req.json();

    if (!itemId || !address || typeof landmark === 'undefined' || lat === null || lng === null) {
      return NextResponse.json({ message: "Missing or invalid fields." }, { status: 400 });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return NextResponse.json({ message: "Item not found." }, { status: 404 });
    }

    // Set landmark to 'N/A' if empty to satisfy required validation
    item.pickupAddress = {
      address,
      landmark: landmark && landmark.trim() !== "" ? landmark : "N/A",
      latitude: lat,
      longitude: lng,
    };
    item.status = "Scheduled"; // Assuming status changes to Scheduled after address submission

    await item.save();

    return NextResponse.json({ success: true, message: "Pickup address updated successfully." }, { status: 200 });
  } catch (e: any) {
    console.error("POST /api/pickups/update-address Error:", e);
    return NextResponse.json({ message: e.message || "Server error." }, { status: 500 });
  }
}
