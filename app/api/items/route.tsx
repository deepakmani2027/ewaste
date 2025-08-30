import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { ItemSchema } from '@/lib/types';

// --- Classification Logic ---
function autoClassify(item: {
  name: string,
  notes?: string,
  category: string,
  condition: string,
  ageMonths: number
}) {
  const { name, notes, category, condition, ageMonths } = item;
  const lowerName = name.toLowerCase();
  const lowerNotes = notes?.toLowerCase() || "";

  if (category === "Battery" || lowerName.includes("acid") || lowerNotes.includes("acid")) {
    return { type: "Hazardous", notes: "Contains hazardous materials." };
  }

  const isPotentiallyReusable = ["Computer", "Projector", "Lab Equipment", "Mobile Device", "Accessory"].includes(category);
  const isGoodCondition = ["Good", "Fair"].includes(condition);
  if (isPotentiallyReusable && isGoodCondition && ageMonths < 48) {
    return { type: "Reusable", notes: "Item may be suitable for reuse." };
  }

  return { type: "Recyclable", notes: "" };
}

const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);

async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not defined.');
  return mongoose.connect(mongoUri);
}

// --- CREATE ---
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const {
      name,
      department,
      category,
      ageMonths,
      condition,
      notes,
      createdBy,
      biddingStatus,
      startingBid,
      biddingEndDate,
    } = body;

    if (!name || !department || !category || !createdBy) {
      return NextResponse.json(
        { message: 'Missing required fields, including createdBy.' },
        { status: 400 }
      );
    }

    const newItemData: any = {
      name,
      department,
      category,
      ageMonths: Number(ageMonths) || 0,
      condition,
      notes,
      createdBy,
      classification: autoClassify({
        name,
        notes,
        category,
        condition,
        ageMonths: Number(ageMonths) || 0,
      }),
      status: "Reported",
      qrId: `qr-${Date.now()}`,
    };

    if (biddingStatus === "open") {
      newItemData.biddingStatus = "open";
      newItemData.startingBid = Number(startingBid) || 0;
      newItemData.currentHighestBid = Number(startingBid) || 0;
      newItemData.biddingEndDate = biddingEndDate ? new Date(biddingEndDate) : null;
    }

    const newItem = new Item(newItemData);
    await newItem.save();

    // Optional notify
    try {
      // @ts-ignore
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('ew-items');
        bc.postMessage({ type: 'created', id: String(newItem._id) });
        bc.close();
      }
    } catch {}

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('POST /api/items Error:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ message: error.message, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

// --- LIST (optionally by userEmail) ---
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const id = searchParams.get('id');

    if (id) {
      const item = await Item.findById(id);
      if (!item) {
        return NextResponse.json({ message: 'Item not found.' }, { status: 404 });
      }
      return NextResponse.json(item, { status: 200 });
    }

    const query: any = userEmail ? { createdBy: userEmail } : {};
    const items = await Item.find(query).sort({ createdAt: -1 });
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error('GET /api/items Error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred while fetching items.' },
      { status: 500 }
    );
  }
}

// --- DELETE (owner only) ---
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');
    const userEmail = searchParams.get('userEmail');

    if (!itemId || !userEmail) {
      return NextResponse.json(
        { message: 'Item ID and user email are required for deletion.' },
        { status: 400 }
      );
    }

    const deletedItem = await Item.findOneAndDelete({ _id: itemId, createdBy: userEmail });
    if (!deletedItem) {
      return NextResponse.json(
        { message: 'Item not found or user not authorized to delete.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Item deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/items Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

// --- PATCH (owner only) ---
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { id, userEmail, ...updateData } = body;
    if (!id || !userEmail) {
      return NextResponse.json(
        { message: 'Item ID and user email are required for update.' },
        { status: 400 }
      );
    }

    const existingItem = await Item.findOne({ _id: id, createdBy: userEmail });
    if (!existingItem) {
      return NextResponse.json(
        { message: 'Item not found or user not authorized to update.' },
        { status: 404 }
      );
    }

    const normalized = {
      name: updateData.name ?? existingItem.name,
      department: updateData.department ?? existingItem.department,
      category: updateData.category ?? existingItem.category,
      ageMonths: typeof updateData.ageMonths === 'number' ? updateData.ageMonths : existingItem.ageMonths,
      condition: updateData.condition ?? existingItem.condition,
      notes: updateData.notes ?? existingItem.notes,
      classification:
        updateData.classification ??
        existingItem.classification ??
        autoClassify({
          name: updateData.name ?? existingItem.name,
          notes: updateData.notes ?? existingItem.notes,
          category: updateData.category ?? existingItem.category,
          condition: updateData.condition ?? existingItem.condition,
          ageMonths:
            typeof updateData.ageMonths === 'number' ? updateData.ageMonths : existingItem.ageMonths,
        }),
      status: updateData.status ?? existingItem.status ?? 'Reported',
      qrId: existingItem.qrId,
      createdBy: existingItem.createdBy,
      pickupId: updateData.pickupId ?? existingItem.pickupId,
      auditTrail: updateData.auditTrail ?? existingItem.auditTrail,
      disposalHistory: updateData.disposalHistory ?? existingItem.disposalHistory,
      disposedAt: updateData.disposedAt ?? existingItem.disposedAt,
      disposedBy: updateData.disposedBy ?? existingItem.disposedBy,
    };

    const updatedItem = await Item.findByIdAndUpdate(
      id,
      { $set: normalized },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return NextResponse.json({ message: 'Failed to update item.' }, { status: 500 });
    }

    try {
      // @ts-ignore
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('ew-items');
        bc.postMessage({ type: 'updated', action: 'update', id });
        bc.close();
      }
    } catch {}

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/items Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
