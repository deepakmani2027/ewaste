import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

// --- Define Schemas to ensure models are available with all necessary fields ---
const ItemSchema = new mongoose.Schema({
  winningBidderId: { type: String, index: true },
  biddingStatus: { type: String, index: true }, // <-- This field is crucial for the logic
});

const PickupSchema = new mongoose.Schema({
  vendorId: { type: String, required: true, index: true },
});

const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);
const Pickup = mongoose.models.Pickup || mongoose.model('Pickup', PickupSchema);

// --- Database Connection (re-usable) ---
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not defined.');
  return mongoose.connect(mongoUri);
}

// --- GET aggregated stats for a specific vendor ---
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ message: "The 'vendorId' query parameter is required." }, { status: 400 });
    }

    // --- FIX: Updated queries to correctly calculate stats ---
    const [auctionsWon, activeBids, pickupsScheduled] = await Promise.all([
      // An auction is "won" only if the vendor is the winner AND the auction is closed.
      Item.countDocuments({ winningBidderId: vendorId, biddingStatus: "closed" }),
      
      // A bid is "active" if the vendor is the current high bidder AND the auction is still open.
      Item.countDocuments({ winningBidderId: vendorId, biddingStatus: "open" }),

      Pickup.countDocuments({ vendorId: vendorId })
    ]);

    const stats = {
        auctionsWon,
        pickupsScheduled,
        activeBids
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('GET /api/vendors/stats Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
