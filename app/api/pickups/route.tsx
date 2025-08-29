import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

// --- Define Schemas to ensure models are available ---
// We need a minimal Item schema to populate the item names
const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const PickupSchema = new mongoose.Schema({
  vendorId: { type: String, required: true, index: true },
  itemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }], // Reference the Item model
  date: { type: String, required: true },
  notes: { type: String },
  createdBy: { type: String, required: true },
}, { timestamps: true });

const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);
const Pickup = mongoose.models.Pickup || mongoose.model('Pickup', PickupSchema);

// --- Database Connection (re-usable) ---
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not defined.');
  return mongoose.connect(mongoUri);
}

// --- GET all pickups assigned to a specific vendor ---
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ message: "The 'vendorId' query parameter is required." }, { status: 400 });
    }

    // Find all pickups for the vendor and populate the 'itemIds' field.
    // .populate() will replace the item ObjectIds with the full item documents.
    const pickups = await Pickup.find({ vendorId: vendorId })
      .sort({ date: 1 }) // Sort by the soonest pickup date
      .populate('itemIds', 'name'); // Only fetch the 'name' field from the Item documents

    return NextResponse.json(pickups, { status: 200 });
  } catch (error) {
    console.error('GET /api/pickups Error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: 'An internal server error occurred.', error: errorMessage }, { status: 500 });
  }
}
