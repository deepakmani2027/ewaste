// Run this script with: node fix-ewitem-fields.js
// Make sure to set your MONGODB_URI in the environment or hardcode it below.

const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db-name';

const ClassificationSchema = new mongoose.Schema({
  type: { type: String, enum: ["Recyclable", "Reusable", "Hazardous"], required: true },
  notes: { type: String, default: '' },
}, { _id: false });

const ItemSchema = new mongoose.Schema({
  name: String,
  department: String,
  category: String,
  ageMonths: Number,
  condition: String,
  notes: String,
  classification: ClassificationSchema,
  status: String,
  qrId: String,
  createdBy: String,
  pickupId: String,
  auditTrail: [{ date: String, user: String, stage: String, status: String }],
  disposalHistory: [{ date: String, user: String, action: String }],
  disposedAt: String,
  disposedBy: String,
}, { timestamps: true });

const Item = mongoose.model('Item', ItemSchema);

function cleanString(val) {
  return typeof val === 'string' ? val.trim().replace(/,+$/, '') : '';
}

async function fixItems() {
  await mongoose.connect(mongoUri);
  const items = await Item.find({});
  let updated = 0;
  for (const item of items) {
    let changed = false;
    // Set defaults and clean fields
    if (!item.condition) { item.condition = 'Good'; changed = true; }
    if (!item.status) { item.status = 'Reported'; changed = true; }
    if (!item.qrId) { item.qrId = `qr-${item._id}`; changed = true; }
    if (!item.classification || !item.classification.type) {
      item.classification = { type: 'Recyclable', notes: '' }; changed = true;
    }
    if (!item.createdAt) { item.createdAt = new Date().toISOString(); changed = true; }
    if (!item.updatedAt) { item.updatedAt = new Date().toISOString(); changed = true; }
    if (!item.auditTrail) { item.auditTrail = []; changed = true; }
    if (!item.disposalHistory) { item.disposalHistory = []; changed = true; }
    // Clean string fields
    ['name','department','category','condition','notes','status','qrId','createdBy','pickupId','disposedAt','disposedBy'].forEach(f => {
      if (item[f]) {
        const cleaned = cleanString(item[f]);
        if (item[f] !== cleaned) { item[f] = cleaned; changed = true; }
      }
    });
    if (changed) {
      await item.save();
      updated++;
    }
  }
  console.log(`Updated ${updated} items.`);
  await mongoose.disconnect();
}

fixItems().catch(e => { console.error(e); process.exit(1); });
