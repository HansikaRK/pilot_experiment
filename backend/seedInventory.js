require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Warehouse = require('./models/Warehouse');
const InventoryBatch = require('./models/InventoryBatch');
const ShippingZone = require('./models/ShippingZone');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ceyloncart';

async function seedInventory() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Create a Warehouse
    await Warehouse.deleteMany();
    const warehouse = await Warehouse.create({ name: 'Colombo Main', location: 'Colombo' });
    console.log('Created Warehouse:', warehouse.name);

    // 2. Create Shipping Zones
    await ShippingZone.deleteMany();
    await ShippingZone.create([
      { name: 'Colombo', type: 'district', value: 'Colombo', baseRateMinor: 50000, perKgRateMinor: 10000, freeShippingThresholdMinor: 500000 },
      { name: 'Gampaha', type: 'district', value: 'Gampaha', baseRateMinor: 60000, perKgRateMinor: 10000, freeShippingThresholdMinor: 600000 },
      { name: 'Island Wide', type: 'country', value: 'Sri Lanka', baseRateMinor: 100000, perKgRateMinor: 20000, freeShippingThresholdMinor: 1000000 },
    ]);
    console.log('Created Shipping Zones');

    // 3. Create Inventory Batches for all existing products
    await InventoryBatch.deleteMany();
    const products = await Product.find();
    
    let batchesCreated = 0;
    for (const product of products) {
      // Create a batch with 50 units, expiring in 1 year
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);

      await InventoryBatch.create({
        productId: product._id,
        warehouseId: warehouse._id,
        quantity: 50,
        expiryDate: expiry
      });
      batchesCreated++;
    }
    
    console.log(`Created ${batchesCreated} inventory batches.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding inventory:', error);
    process.exit(1);
  }
}

seedInventory();
