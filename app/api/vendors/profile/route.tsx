import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

// --- Vendor Schema ---
const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contact: { type: String }, // Assuming contact is part of the User/Vendor model
  certified: { type: Boolean, default: false },
  // Add other fields as necessary
}, { timestamps: true });

const Vendor = mongoose.models.User || mongoose.model('User', VendorSchema); // Assuming vendors are stored in the 'users' collection

// --- Database Connection ---
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not defined.');
  return mongoose.connect(mongoUri);
}

// --- GET a specific vendor's profile ---
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ message: "The 'vendorId' query parameter is required." }, { status: 400 });
    }

    const vendor = await Vendor.findById(vendorId).select('-password'); // Exclude password from the result
    if (!vendor) {
        return NextResponse.json({ message: "Vendor not found." }, { status: 404 });
    }

    return NextResponse.json(vendor, { status: 200 });
  } catch (error) {
    console.error('GET /api/vendors/profile Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

// --- PUT: Update a vendor's profile ---
export async function PUT(request: NextRequest) {
    try {
        await connectToDatabase();
        const { vendorId, name, contact } = await request.json();

        if (!vendorId || !name || !contact) {
            return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
        }

        const updatedVendor = await Vendor.findByIdAndUpdate(
            vendorId, 
            { name, contact },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedVendor) {
            return NextResponse.json({ message: 'Vendor not found.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Profile updated successfully.', vendor: updatedVendor }, { status: 200 });
    } catch (error) {
        console.error('PUT /api/vendors/profile Error:', error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
