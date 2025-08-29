import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

// --- User and Item Schemas ---
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const ItemSchema = new mongoose.Schema({
  createdBy: { type: String, required: true, index: true },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);

// --- Database Connection ---
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;

  // --- FIX: Check for the environment variable before connecting ---
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  return mongoose.connect(mongoUri);
}

// --- API Handler to CHANGE PASSWORD ---
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const { email, oldPassword, newPassword } = await request.json();

    if (!email || !oldPassword || !newPassword) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
        return NextResponse.json({ message: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Incorrect old password.' }, { status: 401 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;
    await user.save();

    return NextResponse.json({ message: 'Password updated successfully.' }, { status: 200 });
  } catch (error) {
    console.error('PUT /api/user Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

// --- API Handler to DELETE ACCOUNT ---
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json({ message: 'User email is required for deletion.' }, { status: 400 });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const deletedUser = await User.findOneAndDelete({ email: userEmail }).session(session);
        if (!deletedUser) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }

        await Item.deleteMany({ createdBy: userEmail }).session(session);

        await session.commitTransaction();
        return NextResponse.json({ message: 'Account and all associated data deleted successfully.' }, { status: 200 });
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
  } catch (error) {
    console.error('DELETE /api/user Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
