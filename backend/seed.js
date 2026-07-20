require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');
const Order = require('./models/Order');

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

    // 5. Read orders from JSON file
    const ordersPath = path.join(__dirname, 'data', 'orders.json');
    const ordersData = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));

    // 6. Delete existing orders
    await Order.deleteMany();
    console.log('🗑️  Cleared existing orders from database');

    // 7. Process and insert orders
    const ordersToInsert = [];
    for (const orderSeed of ordersData) {
      const items = [];
      let totalAmount = 0;

      for (const itemSeed of orderSeed.items) {
        // Find product by name
        const dbProduct = insertedProducts.find(p => p.name === itemSeed.productName);
        if (!dbProduct) {
          throw new Error(`Product not found during order seeding: ${itemSeed.productName}`);
        }

        const price = dbProduct.price;
        const quantity = itemSeed.quantity;
        totalAmount += price * quantity;

        items.push({
          productId: dbProduct._id,
          name: dbProduct.name,
          price,
          quantity
        });
      }

      ordersToInsert.push({
        orderId: orderSeed.orderId,
        customer: orderSeed.customer,
        items,
        totalAmount,
        paymentStatus: orderSeed.paymentStatus,
        createdAt: new Date(orderSeed.createdAt)
      });
    }

    const insertedOrders = await Order.insertMany(ordersToInsert);
    console.log(`🌱 Successfully inserted ${insertedOrders.length} orders`);

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

