import mongoose from 'mongoose';

// --- ENUMERATED TYPES ---
export type EwStatus =
  | "Reported"
  | "Scheduled"
  | "Collected"
  | "Sorted"
  | "Processed"
  | "Recycled"
  | "Disposed";

export type BiddingStatus = "open" | "closed" | "draft";

// --- CORE DATA TYPES ---
export type EwItem = {
  _id: string;                   // use _id everywhere in UI
  qrId: string;
  name: string;
  department:
    | "Engineering"
    | "Sciences"
    | "Humanities"
    | "Administration"
    | "Hostel"
    | "Other";
  category:
    | "Computer"
    | "Projector"
    | "Lab Equipment"
    | "Mobile Device"
    | "Battery"
    | "Accessory"
    | "Other";
  ageMonths: number;
  condition: "Good" | "Fair" | "Poor" | "Dead";
  notes?: string;
  status: EwStatus;
  createdAt: string;
  classification: { type: "Recyclable" | "Reusable" | "Hazardous"; notes?: string };
  createdBy: string;
  pickupId?: string;
  auditTrail?: Array<{ date: string; user: string; stage: string; status: string }>;
  disposalHistory?: Array<{ date: string; user: string; action: string }>;
  disposedAt?: string;
  disposedBy?: string;

  // --- Bidding fields ---
  biddingStatus: BiddingStatus;
  startingBid: number;
  currentHighestBid: number;
  biddingEndDate: string; // ISO date string
  winningBidderId?: string; // ✅ ensure string type
  pickupAddress?: PickupAddress; // New field for pickup address
};

export type Vendor = {
  _id: string;
  name: string;
  contact: string;
  certified: boolean;
};

export type Pickup = {
  _id: string;
  date: string;      // YYYY-MM-DD
  vendorId: string;
  itemIds: string[];
  notes?: string;
  address?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
};

export type Bid = {
  _id: string;
  itemId: string;
  vendorId: string;
  bidAmount: number;
  createdAt: string;
};

export type User = {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'vendor' | 'admin';
  contact?: string;
  certified?: boolean;
};

// Define PickupAddress type
export type PickupAddress = {
  address: string;
  landmark: string;
  latitude: number;
  longitude: number;
};

// --- MONGOOSE SCHEMAS ---

const ClassificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Recyclable", "Reusable", "Hazardous"], required: true },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const PickupAddressSchema = new mongoose.Schema({
  address: { type: String, required: true },
  landmark: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
}, { _id: false });

export const ItemSchema = new mongoose.Schema(
  {
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
    auditTrail: { type: Array },
    disposalHistory: { type: Array },
    disposedAt: { type: String },
    disposedBy: { type: String },

    // --- Bidding fields ---
    biddingStatus: { type: String, enum: ["open", "closed", "draft"], default: "draft" },
    startingBid: { type: Number, default: 0 },
    currentHighestBid: { type: Number, default: 0 },
    biddingEndDate: { type: Date },
    winningBidderId: { type: String }, // ✅ stored as string
    pickupAddress: { type: PickupAddressSchema }, // New field for pickup address
  },
  { timestamps: true }
);

// Exporting a model here can be okay, but to avoid redefinition across routes,
// always guard with mongoose.models.Item in your routes.
// Keeping it for compatibility with existing imports if any:
const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);
export default Item;
