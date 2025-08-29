import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

// --- Campaign Participation Schema and Model ---
const CampaignParticipationSchema = new mongoose.Schema({
  campaignId: { type: String, required: true },
  userEmail: { type: String, required: true },
}, { timestamps: true });

CampaignParticipationSchema.index({ campaignId: 1, userEmail: 1 }, { unique: true });

const CampaignParticipation = mongoose.models.CampaignParticipation || mongoose.model('CampaignParticipation', CampaignParticipationSchema);

// --- Database Connection (re-usable) ---
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  
  // --- FIX: Check if the environment variable exists before connecting ---
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  return mongoose.connect(mongoUri);
}

// --- GET: Check if a user has joined a specific campaign ---
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const campaignId = searchParams.get('campaignId');

    if (!userEmail || !campaignId) {
      return NextResponse.json({ message: "userEmail and campaignId are required." }, { status: 400 });
    }

    const participation = await CampaignParticipation.findOne({ userEmail, campaignId });

    return NextResponse.json({ isJoined: !!participation }, { status: 200 });
  } catch (error) {
    console.error('GET /api/campaigns Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

// --- POST: Join a campaign ---
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { userEmail, campaignId } = await request.json();

    if (!userEmail || !campaignId) {
      return NextResponse.json({ message: 'userEmail and campaignId are required.' }, { status: 400 });
    }

    const newParticipation = new CampaignParticipation({ userEmail, campaignId });
    await newParticipation.save();

    return NextResponse.json({ message: 'Successfully joined campaign.' }, { status: 201 });
  } catch (error) {
    // --- FIX: Check the type of the error before accessing properties ---
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
        return NextResponse.json({ message: 'User has already joined this campaign.' }, { status: 409 });
    }
    console.error('POST /api/campaigns Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

// --- DELETE: Leave a campaign ---
export async function DELETE(request: NextRequest) {
    try {
        await connectToDatabase();
        const { userEmail, campaignId } = await request.json();

        if (!userEmail || !campaignId) {
            return NextResponse.json({ message: 'userEmail and campaignId are required.' }, { status: 400 });
        }

        await CampaignParticipation.deleteOne({ userEmail, campaignId });

        return NextResponse.json({ message: 'Successfully left campaign.' }, { status: 200 });
    } catch (error) {
        console.error('DELETE /api/campaigns Error:', error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
