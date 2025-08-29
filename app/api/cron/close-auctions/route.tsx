import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

// --- Item Schema ---
const ItemSchema = new mongoose.Schema({
  biddingStatus: { type: String, index: true },
  biddingEndDate: { type: Date },
});

const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);

// --- Database Connection ---
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not defined.');
  return mongoose.connect(mongoUri);
}

export async function GET(request: NextRequest) {
  // It's crucial to secure this endpoint.
  // For Vercel Cron Jobs, you can check for a secret key from an environment variable.
  const authToken = request.headers.get('authorization');
  if (authToken !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await connectToDatabase();
    const now = new Date();

    // Find all items where the status is "open" and the end date is in the past
    const result = await Item.updateMany(
      { biddingStatus: "open", biddingEndDate: { $lte: now } },
      { $set: { biddingStatus: "closed" } }
    );

    console.log(`Cron Job: Closed ${result.modifiedCount} auctions.`);
    return NextResponse.json({ success: true, closedCount: result.modifiedCount });
  } catch (error) {
    console.error("Cron Job Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
