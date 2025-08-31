import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { ItemSchema } from "@/lib/types";

const Item = mongoose.models.Item || mongoose.model("Item", ItemSchema);
// Define (or reuse) Pickup model so we can create a pickup entry when address is supplied
const PickupSchema = new mongoose.Schema({
  date: { type: String, required: true },
  vendorId: { type: String, required: true },
  itemIds: [{ type: String, required: true }],
  notes: { type: String },
  createdBy: { type: String, required: true, index: true },
  // Address fields (optional) so scheduling UI can read directly
  address: { type: String },
  landmark: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
}, { timestamps: true });
const Pickup = mongoose.models.Pickup || mongoose.model('Pickup', PickupSchema);

async function connect() {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not defined.");
  await mongoose.connect(mongoUri);
}

export async function POST(req: NextRequest) {
  try {
    await connect();
  const { itemId, address, landmark, lat, lng, vendorId } = await req.json();

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

    // Save updated item (with pickupAddress / status)
    await item.save();

    // Create a Pickup document if we have a vendorId and no existing pickup yet
    let createdPickupId: string | null = null;
    if (vendorId && typeof vendorId === 'string') {
      const existingPickup = await Pickup.findOne({ itemIds: itemId });
      if (!existingPickup) {
        // Align pickup date with quick scheduling logic: default +3 days (configurable via env)
  const offsetDays = parseInt(process.env.PICKUP_OFFSET_DAYS || '3', 10);
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  const scheduledDate = `${yyyy}-${mm}-${dd}`;
        const finalBid = (item as any).currentHighestBid;
        const noteBase = typeof finalBid === 'number' && finalBid > 0
          ? `Pickup for auction winner. Final bid: ₹${finalBid}`
          : 'Pickup for auction winner.';
        const newPickup = new Pickup({
          date: scheduledDate,
          vendorId,
          itemIds: [itemId],
          notes: noteBase,
          createdBy: item.createdBy,
          address,
          landmark: item.pickupAddress?.landmark,
          latitude: lat,
          longitude: lng,
        });
        await newPickup.save();
        // Link item to pickup
        item.pickupId = newPickup._id.toString();
        await item.save();
        createdPickupId = newPickup._id.toString();
      } else {
        // If pickup exists but has no address saved yet, update it (idempotent)
        if (!existingPickup.address) {
          existingPickup.address = address;
          existingPickup.landmark = item.pickupAddress?.landmark || landmark;
          existingPickup.latitude = lat;
          existingPickup.longitude = lng;
          await existingPickup.save();
        }
      }
    }

    return NextResponse.json({ success: true, message: "Pickup address updated successfully.", pickupId: createdPickupId }, { status: 200 });
  } catch (e: any) {
    console.error("POST /api/pickups/update-address Error:", e);
    return NextResponse.json({ message: e.message || "Server error." }, { status: 500 });
  }
}
