import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

// Ensure the Item model is available
const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  category: { type: String, required: true },
  ageMonths: { type: Number, required: true },
  condition: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, required: true },
  classification: {
    type: { type: String, enum: ["Recyclable", "Reusable", "Hazardous"] },
  },
  createdBy: { type: String, required: true, index: true },
});

const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);

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

// --- API Handler to GET aggregated analytics data for a user ---
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json({ message: "The 'userEmail' query parameter is required." }, { status: 400 });
    }

    // Fetch all items for the specific user
    const items = await Item.find({ createdBy: userEmail });

    // --- Perform Aggregation on the Server ---
    const byMonth: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const classificationCount: Record<string, number> = { Recyclable: 0, Reusable: 0, Hazardous: 0 };
    
    // Placeholder assumptions for impact calculation
    const weightMap: Record<string, number> = { Computer: 7, Projector: 3, "Lab Equipment": 10, "Mobile Device": 0.2, Battery: 0.05, Accessory: 0.1, Other: 1 };
    const emissionFactorPerKg = 1.8;
    const progressMultiplier: Record<string, number> = { Reported: 0, Scheduled: 0.15, Collected: 0.35, Sorted: 0.55, Processed: 0.75, Recycled: 1.0, Disposed: 0 };
    
    let avoidedImpact = 0;
    let potentialImpact = 0;
    let recycledCount = 0;

    items.forEach(i => {
      const d = new Date(i.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
      byCategory[i.category] = (byCategory[i.category] || 0) + 1;
      if (i.classification) {
        classificationCount[i.classification.type] = (classificationCount[i.classification.type] || 0) + 1;
      }

      if (i.classification?.type !== 'Hazardous' && i.status !== 'Disposed') {
        const weight = weightMap[i.category] ?? 1;
        const fullImpact = weight * emissionFactorPerKg;
        potentialImpact += fullImpact;
        const mult = progressMultiplier[i.status] ?? 0;
        avoidedImpact += fullImpact * mult;
        if (i.status === 'Recycled') recycledCount++;
      }
    });

    const analyticsData = {
      byMonth,
      byCategory,
      classificationCount,
      recycledCount,
      impactKgCO2: avoidedImpact,
      potentialKgCO2: potentialImpact,
      totalItems: items.length,
    };

    return NextResponse.json(analyticsData, { status: 200 });
  } catch (error) {
    console.error('GET /api/analytics Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
