import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

// --- Vendor Schema and Model ---
const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contact: { type: String, required: true, trim: true },
  certified: { type: Boolean, default: false },
}, { timestamps: true });

const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);

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

// --- GET all vendors ---
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('id');

    if (vendorId) {
      const vendor = await Vendor.findById(new mongoose.Types.ObjectId(vendorId));
      if (!vendor) {
        return NextResponse.json({ message: 'Vendor not found.' }, { status: 404 });
      }
      return NextResponse.json(vendor, { status: 200 });
    }

    const vendors = await Vendor.find({}).sort({ name: 1 });
    return NextResponse.json(vendors, { status: 200 });
  } catch (error) {
    console.error("GET /api/vendors Error:", error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

// --- CREATE a new vendor ---
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    if (!body.name || !body.contact) {
      return NextResponse.json({ message: 'Missing required fields: name and contact.' }, { status: 400 });
    }

    const newVendor = new Vendor(body);
    await newVendor.save();

    return NextResponse.json(newVendor, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

// --- UPDATE a vendor ---
export async function PUT(request: NextRequest) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const { _id, ...updateData } = body;

        if (!_id) {
            return NextResponse.json({ message: 'Vendor ID is required for an update.' }, { status: 400 });
        }

        const updatedVendor = await Vendor.findByIdAndUpdate(_id, updateData, { new: true });

        if (!updatedVendor) {
            return NextResponse.json({ message: 'Vendor not found.' }, { status: 404 });
        }

        return NextResponse.json(updatedVendor, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}

// --- DELETE a vendor ---
export async function DELETE(request: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const vendorId = searchParams.get('id');

        if (!vendorId) {
            return NextResponse.json({ message: 'Vendor ID is required for deletion.' }, { status: 400 });
        }

        const deletedVendor = await Vendor.findByIdAndDelete(vendorId);

        if (!deletedVendor) {
            return NextResponse.json({ message: 'Vendor not found.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Vendor deleted successfully.' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
