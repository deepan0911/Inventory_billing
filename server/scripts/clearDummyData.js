// ✅ Load environment variables FIRST
require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");
const Product = require("../models/Product");
const Discount = require("../models/Discount");
const connectDB = require("../config/database");

const clearDummyData = async () => {
  try {
    await connectDB();

    console.log("🧹 Clearing dummy data from database...");

    // Clear all products (dummy products)
    const productCount = await Product.countDocuments();
    await Product.deleteMany({});
    console.log(`✅ Deleted ${productCount} products`);

    console.log("🎉 Dummy data cleared successfully!");
    console.log("📝 Admin and Cashier users are preserved");
    console.log("📝 You can now add real products through the application");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error clearing dummy data:", err);
    process.exit(1);
  }
};

clearDummyData();
