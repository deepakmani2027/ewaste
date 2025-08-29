import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose'; // <-- Import the JWT library

// --- User Schema and Model ---
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'vendor'], default: 'user' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// --- JWT Secret ---
// This MUST be the same secret key used in your AuthContext.
// It's best practice to store this in an environment variable.
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "DEMO_ONLY_CHANGE_ME_32+_BYTES_SECRET_FOR_JWT_SIGNING_2025_EWASTE"
);

// --- Database Connection ---
let cachedDb: typeof mongoose | null = null;
async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }
    const db = await mongoose.connect(mongoUri);
    cachedDb = db;
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw new Error("Could not connect to database.");
  }
}

// --- API Handler for Login POST requests ---
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    // --- FIX: Create a JWT token upon successful login ---
    const userPayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    
    const token = await new SignJWT(userPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h") // Token will expire in 2 hours
      .sign(SECRET);

    // --- FIX: Return the token along with the user data ---
    return NextResponse.json({ 
      message: 'Login successful.',
      user: userPayload,
      token: token, // <-- The missing piece
    }, { status: 200 });

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
