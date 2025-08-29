import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

// Duplicate schema/model definition (could be refactored later)
const ClassificationSchema = new mongoose.Schema({
  type: { type: String, enum: ["Recyclable", "Reusable", "Hazardous"], required: true },
  notes: { type: String, default: '' },
}, { _id: false });

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  department: { type: String, required: true },
  category: { type: String, required: true },
  ageMonths: { type: Number, required: true },
  condition: { type: String, required: true },
  notes: { type: String, trim: true },
  classification: { type: ClassificationSchema, required: true },
  status: { type: String, default: "Reported" },
  qrId: { type: String },
  createdBy: { type: String, required: true, index: true },
  pickupId: { type: String },
  auditTrail: [{ date: String, user: String, stage: String, status: String }],
  disposalHistory: [{ date: String, user: String, action: String }],
  disposedAt: { type: String },
  disposedBy: { type: String },
}, { timestamps: true });

const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);

let cachedDb: typeof mongoose | null = null;
async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not defined.');
  const db = await mongoose.connect(mongoUri);
  cachedDb = db;
  return db;
}

export async function GET() {
  try {
    await connectToDatabase();
    const items = await Item.find({}).sort({ createdAt: -1 });
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error('GET /api/all-items Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
