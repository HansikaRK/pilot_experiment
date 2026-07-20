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

    // 3. Delete existing products & seed new ones
    await Product.deleteMany();
    console.log('🗑️  Cleared existing products from database');

    const insertedProducts = await Product.insertMany(productsData);
    console.log(`🌱 Successfully inserted ${insertedProducts.length} products`);

    // 4. Seed dummy users
    await User.deleteMany();
    console.log('🗑️  Cleared existing users from database');

    const dummyUsers = [
      {
        name: 'Kasun Perera',
        email: 'user@ceyloncart.com',
        password: 'password123',
        role: 'user'
      },
      {
        name: 'Amara Fernando',
        email: 'admin@ceyloncart.com',
        password: 'password123',
        role: 'admin'
      }
    ];

    for (const u of dummyUsers) {
      await User.create(u);
    }
    console.log(`👤 Successfully seeded ${dummyUsers.length} dummy user accounts (user@ceyloncart.com / admin@ceyloncart.com, pwd: password123)`);

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedDatabase();
