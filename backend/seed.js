require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');
const User = require('./models/User');

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

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    // 8. Disconnect and exit
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedDatabase();

