// ✅ Load environment variables FIRST
require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");
const Product = require("../models/Product");
const connectDB = require("../config/database");

const cleanTestProducts = async () => {
  try {
    await connectDB();

    console.log("🧹 Cleaning up test product data...");

    // Define test product codes that were created during testing
    const testProductCodes = ["HIM-001", "HIM-002"];
    const testProductNames = ["Himalaya Shampoo"];

    // Remove products by test codes
    const codeDeleteResult = await Product.deleteMany({ 
      code: { $in: testProductCodes } 
    });
    console.log(`✅ Deleted ${codeDeleteResult.deletedCount} products by test codes`);

    // Remove products by test names (in case any were created without specific codes)
    const nameDeleteResult = await Product.deleteMany({ 
      name: { $in: testProductNames } 
    });
    console.log(`✅ Deleted ${nameDeleteResult.deletedCount} products by test names`);

    // Get total remaining products
    const totalProducts = await Product.countDocuments();
    console.log(`📊 Total products remaining in database: ${totalProducts}`);

    if (totalProducts === 0) {
      console.log("🎉 All test products have been removed successfully!");
      console.log("📝 Your product database is now clean and ready for real data");
    } else {
      console.log("📝 Some products may remain - these are likely your real products");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error cleaning test products:", err);
    process.exit(1);
  }
};

cleanTestProducts();
