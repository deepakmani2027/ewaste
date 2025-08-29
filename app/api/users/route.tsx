import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

// This schema should reflect your User model, including vendor-specific fields
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'vendor', 'admin'], required: true },
  contact: { type: String }, // Contact info for vendors
  certified: { type: Boolean, default: false }, // Certification status for vendors
}, { timestamps: true });

// Use the existing model if it's already been compiled
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not defined.');
  return mongoose.connect(mongoUri);
}

// This GET handler finds users based on the 'role' query parameter
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('id');

    if (userId) {
      if (!mongoose.isValidObjectId(userId)) {
        return NextResponse.json({ message: "Invalid user ID format." }, { status: 400 });
      }
      const user = await User.findById(new mongoose.Types.ObjectId(userId)).select('-password');
      if (!user) {
        return NextResponse.json({ message: 'User not found.' }, { status: 404 });
      }
      return NextResponse.json(user, { status: 200 });
    }

    if (!role) {
      return NextResponse.json({ message: "A 'role' query parameter or an 'id' query parameter is required." }, { status: 400 });
    }

    const validRoles = ['user', 'vendor', 'admin'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ message: `Invalid role specified: ${role}. Valid roles are ${validRoles.join(', ')}.` }, { status: 400 });
    }
    // Find all users that match the specified role and exclude their passwords from the result
    const users = await User.find({ role: role }).select('-password');

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error(`GET /api/users Error:`, error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
