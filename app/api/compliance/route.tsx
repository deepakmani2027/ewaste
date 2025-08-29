import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

// --- Define Schemas to ensure models are available ---
const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  certified: { type: Boolean, default: false },
});

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, required: true },
  classification: {
    type: { type: String, enum: ["Recyclable", "Reusable", "Hazardous"] },
  },
  createdBy: { type: String, required: true, index: true },
  pickupId: { type: String },
});

const PickupSchema = new mongoose.Schema({
    date: { type: String, required: true },
    vendorId: { type: String, required: true },
    itemIds: [{ type: String, required: true }],
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

// --- GET all data needed for the compliance report for a user ---
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json({ message: "userEmail query parameter is required." }, { status: 400 });
    }

    // Fetch all necessary data in parallel
    const [items, pickups, vendors] = await Promise.all([
        Item.find({ createdBy: userEmail }).sort({ createdAt: -1 }),
        Pickup.find({ createdBy: userEmail }).sort({ date: -1 }),
        Vendor.find({}) // Vendors are typically not user-specific
    ]);

    return NextResponse.json({ items, pickups, vendors }, { status: 200 });
  } catch (error) {
    console.error('GET /api/compliance Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
