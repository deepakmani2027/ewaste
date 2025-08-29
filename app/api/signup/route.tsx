import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

// --- User Schema and Model with Vendor Fields ---
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name.'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address.',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    required: true,
    default: 'user',
  },
  // --- FIX: Added fields to store vendor-specific information ---
  contact: { 
    type: String,
    default: '' 
  },
  certified: { 
    type: Boolean, 
    default: false 
  },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// --- Database Connection ---
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }
  return mongoose.connect(mongoUri);
}

// --- API Handler for POST requests ---
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // --- FIX: Destructure all possible fields from the body ---
    const { name, email, password, role, vendorName, vendorEmail, vendorPhone } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }
    if (role === 'vendor' && (!vendorName || !vendorEmail)) {
        return NextResponse.json({ message: 'Vendor name and email are required for vendor accounts.' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'An account with this email already exists.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // --- FIX: Build the newUser object based on the role ---
    const newUserPayload: any = {
      name,
      email,
      password: hashedPassword,
      role,
    };

    if (role === 'vendor') {
        newUserPayload.name = vendorName; // Use the specific vendor name
        newUserPayload.contact = vendorEmail; // Use email as the primary contact
        // The 'certified' field will use its default value of 'false'
    }

    const newUser = new User(newUserPayload);
    await newUser.save();

    return NextResponse.json({ message: 'Account created successfully.' }, { status: 201 });

  } catch (error) {
    console.error('Signup API Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
