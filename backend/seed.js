require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');
const User = require('./models/User');
const Warehouse = require('./models/Warehouse');
const InventoryBatch = require('./models/InventoryBatch');
const ShippingZone = require('./models/ShippingZone');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ceyloncart';

const seedDatabase = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // 2. Read products from JSON file
    const dataPath = path.join(__dirname, 'data', 'products.json');
    const productsData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // 3. Delete existing products
    await Product.deleteMany();
    console.log('🗑️  Cleared existing products from database');

    // 4. Insert all products
    const insertedProducts = await Product.insertMany(productsData);
    console.log(`🌱 Successfully inserted ${insertedProducts.length} products`);

    // 5. Seed users
    await User.deleteMany();
    console.log('🗑️  Cleared existing users from database');

    // Use User.create() (not insertMany) so the pre-save hook hashes passwords
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@ceyloncart.com',
      password: 'admin123',
      role: 'admin'
    });

    const customerUser = await User.create({
      name: 'Test Customer',
      email: 'customer@ceyloncart.com',
      password: 'customer123',
      role: 'customer'
    });

    console.log(`👤 Created admin user: ${adminUser.email}`);
    console.log(`👤 Created customer user: ${customerUser.email}`);

    await Warehouse.deleteMany();
    const warehouse = await Warehouse.create({ name: 'Colombo Main', location: 'Colombo' });

    await ShippingZone.deleteMany();
    await ShippingZone.create([
      { name: 'Colombo', type: 'district', value: 'Colombo', baseRateMinor: 50000, perKgRateMinor: 10000, freeShippingThresholdMinor: 500000 },
      { name: 'Gampaha', type: 'district', value: 'Gampaha', baseRateMinor: 60000, perKgRateMinor: 10000, freeShippingThresholdMinor: 600000 },
      { name: 'Kandy', type: 'district', value: 'Kandy', baseRateMinor: 70000, perKgRateMinor: 15000, freeShippingThresholdMinor: 800000 },
      { name: 'Island Wide', type: 'country', value: 'Sri Lanka', baseRateMinor: 100000, perKgRateMinor: 20000, freeShippingThresholdMinor: 1000000 },
    ]);
    console.log('📦 Created shipping zones');

    await InventoryBatch.deleteMany();
    for (const product of insertedProducts) {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);
      await InventoryBatch.create({
        productId: product._id,
        warehouseId: warehouse._id,
        quantity: product.stock || 50,
        expiryDate: expiry
      });
    }
    console.log(`📦 Created inventory batches for ${insertedProducts.length} products`);

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    // 6. Disconnect and exit
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedDatabase();
