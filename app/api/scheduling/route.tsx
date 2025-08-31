import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { ItemSchema } from '@/lib/types';
// --- Define Schemas to ensure models are available ---
const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  certified: { type: Boolean, default: false },
});


// NOTE: Added address fields so pickup cards can display location without needing to look up item.pickupAddress
const PickupSchema = new mongoose.Schema({
  date: { type: String, required: true },
  vendorId: { type: String, required: true },
  itemIds: [{ type: String, required: true }],
  notes: { type: String },
  createdBy: { type: String, required: true, index: true },
  // Optional address meta copied from the item at the time address is provided
  address: { type: String },
  landmark: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
}, { timestamps: true });


const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);
const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);
const Pickup = mongoose.models.Pickup || mongoose.model('Pickup', PickupSchema);

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

// --- GET vendors and schedulable items for a user ---
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json({ message: "userEmail query parameter is required." }, { status: 400 });
    }

    // Fetch vendors and items in parallel for efficiency
    const [vendors, schedulableItems, pickups] = await Promise.all([
        Vendor.find({}).sort({ name: 1 }).lean(),
        // Include both Reported (schedulable) and Scheduled (already assigned) for enrichment
        Item.find({ createdBy: userEmail, status: { $in: ["Reported", "Scheduled"] } })
            .sort({ createdAt: -1 })
            .select('_id name pickupAddress status createdBy')
            .lean(),
  // Sort pickups so the most recently created appears first (ensures newly scheduled pickup shows at top)
  Pickup.find({ createdBy: userEmail }).sort({ createdAt: -1 }).lean()
    ]);

    // Build maps for quick lookup
    const vendorMap = new Map(vendors.map((v: any) => [String(v._id), v]));
    const itemMap = new Map(schedulableItems.map((i: any) => [String(i._id), i]));

    // Collect vendorIds that weren't found in Vendor collection
    const missingVendorIds = new Set<string>();
    pickups.forEach((p: any) => {
      if (!vendorMap.has(String(p.vendorId))) missingVendorIds.add(String(p.vendorId));
    });

    // If there are missing vendors, try fetching them from the Users collection (role vendor/admin)
    let userVendors: Record<string, any> = {};
    if (missingVendorIds.size > 0) {
      try {
        // Dynamically define User model (avoid import cycles) only if needed
        const UserSchema = new mongoose.Schema({
          name: String,
          email: String,
          password: String,
          role: String,
          contact: String,
          certified: Boolean,
        }, { timestamps: true });
        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        const foundUsers = await User.find({ _id: { $in: Array.from(missingVendorIds) }, role: { $in: ['vendor', 'admin'] } }).select('name');
        foundUsers.forEach((u: any) => { userVendors[String(u._id)] = u; });
      } catch (e) {
        console.warn('Scheduling vendor fallback user lookup failed:', e);
      }
    }

    const populatedPickups = pickups.map((p: any) => {
      const items = (p.itemIds || []).map((id: string) => {
        const it = itemMap.get(String(id));
        return it ? { _id: String(it._id), name: it.name, pickupAddress: it.pickupAddress } : { _id: String(id), name: 'Unknown Item' };
      });
      const vendor = vendorMap.get(String(p.vendorId)) || userVendors[String(p.vendorId)];
      return {
        ...p,
        vendorName: vendor ? vendor.name : 'Unknown Vendor',
        itemIds: items,
      };
    });

    return NextResponse.json({ vendors, schedulableItems, pickups, populatedPickups }, { status: 200 });
  } catch (error) {
    console.error('GET /api/scheduling Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

// --- CREATE a new pickup schedule ---
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { itemIds, ...pickupData } = body;

    if (!itemIds || itemIds.length === 0) {
      return NextResponse.json({ message: 'Missing required fields: itemIds.' }, { status: 400 });
    }

    // Attempt to derive address fields from first item if available
    let addressFields: any = {};
    try {
      if (itemIds.length > 0) {
        const first = await Item.findById(itemIds[0]);
        if (first?.pickupAddress?.address) {
          addressFields = {
            address: first.pickupAddress.address,
            landmark: first.pickupAddress.landmark,
            latitude: first.pickupAddress.latitude,
            longitude: first.pickupAddress.longitude,
          };
        }
      }
    } catch {}

    // If a pickup already exists for ANY of these itemIds, return that instead of creating a duplicate.
    // This prevents the UI from showing two nearly identical history cards (e.g. one from address update + one from manual scheduling).
    const existing = await Pickup.findOne({ itemIds: { $in: itemIds } }).lean();
    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

  // Standardize date: always set to local date + offset (default 3 days) to avoid UTC slice issues.
  const offsetDays = parseInt(process.env.PICKUP_OFFSET_DAYS || '3', 10);
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  const standardizedDate = `${yyyy}-${mm}-${dd}`;
  // Create the new pickup document (with optional address)
  const newPickup = new Pickup({ ...pickupData, date: standardizedDate, itemIds, ...addressFields });
    await newPickup.save();

    // Update the status of all included items in the database
    await Item.updateMany(
      { _id: { $in: itemIds } },
      { $set: { status: "Scheduled", pickupId: newPickup._id.toString() } }
    );

    return NextResponse.json(newPickup, { status: 201 });
  } catch (error) {
    console.error('POST /api/scheduling Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
