import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { ItemSchema } from '@/lib/types';
// --- Define Schemas to ensure models are available ---
const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  certified: { type: Boolean, default: false },
});


const PickupSchema = new mongoose.Schema({
    date: { type: String, required: true },
    vendorId: { type: String, required: true },
    itemIds: [{ type: String, required: true }],
    notes: { type: String },
    createdBy: { type: String, required: true, index: true },
}, { timestamps: true });


const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);
const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);
const Pickup = mongoose.models.Pickup || mongoose.model('Pickup', PickupSchema);

// --- Database Connection (re-usable) ---
let cachedDb: typeof mongoose | null = null;
async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI is not defined.');
    const db = await mongoose.connect(mongoUri);
    cachedDb = db;
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw new Error("Could not connect to database.");
  }
}

// --- GET vendors and schedulable items for a user ---
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json({ message: "userEmail query parameter is required." }, { status: 400 });
    }

    // Fetch vendors and items in parallel for efficiency
    const [vendors, schedulableItems, pickups] = await Promise.all([
        Vendor.find({}).sort({ name: 1 }),
        Item.find({ createdBy: userEmail, status: "Reported" }).sort({ createdAt: -1 }),
        Pickup.find({ createdBy: userEmail }).sort({ date: -1 })
    ]);

    return NextResponse.json({ vendors, schedulableItems, pickups }, { status: 200 });
  } catch (error) {
    console.error('GET /api/scheduling Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

// --- CREATE a new pickup schedule ---
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { itemIds, ...pickupData } = body;

    if (!itemIds || itemIds.length === 0) {
      return NextResponse.json({ message: 'Missing required fields: itemIds.' }, { status: 400 });
    }

    // Create the new pickup document
    const newPickup = new Pickup({ ...pickupData, itemIds });
    await newPickup.save();

    // Update the status of all included items in the database
    await Item.updateMany(
      { _id: { $in: itemIds } },
      { $set: { status: "Scheduled", pickupId: newPickup._id.toString() } }
    );

    return NextResponse.json(newPickup, { status: 201 });
  } catch (error) {
    console.error('POST /api/scheduling Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
