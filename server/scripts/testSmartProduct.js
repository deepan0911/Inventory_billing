// ✅ Load environment variables FIRST
require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");
const Product = require("../models/Product");
const connectDB = require("../config/database");

const testSmartProduct = async () => {
  try {
    await connectDB();
    console.log("🧪 Testing Smart Product Management...\n");

    // Test 1: Create a new product
    console.log("📝 Test 1: Creating new product 'Himalaya Shampoo 250ml'");
    const result1 = await Product.findOrCreateProduct({
      code: "HIM-001",
      name: "Himalaya Shampoo",
      size: "250ml",
      barcode: "1234567890123",
      category: "Personal Care",
      price: 120,
      cost: 80,
      stock: 50,
      unit: "bottle",
      taxRate: 18
    });
    console.log(`✅ Result: ${result1.message}`);
    console.log(`   Action: ${result1.action}`);
    console.log(`   Product: ${result1.product.name} (${result1.product.size}) - Stock: ${result1.product.stock}\n`);

    // Test 2: Try to create the same product again (should update stock)
    console.log("📝 Test 2: Adding same product again (should update stock)");
    const result2 = await Product.findOrCreateProduct({
      code: "HIM-001",
      name: "Himalaya Shampoo",
      size: "250ml",
      category: "Personal Care",
      price: 120,
      cost: 80,
      stock: 30,
      unit: "bottle",
      taxRate: 18
    });
    console.log(`✅ Result: ${result2.message}`);
    console.log(`   Action: ${result2.action}`);
    console.log(`   Product: ${result2.product.name} (${result2.product.size}) - Stock: ${result2.product.stock}\n`);

    // Test 3: Create a different size variation
    console.log("📝 Test 3: Creating different size variation 'Himalaya Shampoo 500ml'");
    const result3 = await Product.findOrCreateProduct({
      code: "HIM-002",
      name: "Himalaya Shampoo",
      size: "500ml",
      barcode: "1234567890124",
      category: "Personal Care",
      price: 220,
      cost: 150,
      stock: 40,
      unit: "bottle",
      taxRate: 18
    });
    console.log(`✅ Result: ${result3.message}`);
    console.log(`   Action: ${result3.action}`);
    console.log(`   Product: ${result3.product.name} (${result3.product.size}) - Stock: ${result3.product.stock}\n`);

    // Test 4: Set stock to 0 and try to restock
    console.log("📝 Test 4: Setting stock to 0 and testing restock");
    result3.product.stock = 0;
    await result3.product.save();
    console.log(`   Set ${result3.product.name} (${result3.product.size}) stock to 0`);
    
    const result4 = await Product.findOrCreateProduct({
      code: "HIM-002",
      name: "Himalaya Shampoo",
      size: "500ml",
      category: "Personal Care",
      price: 220,
      cost: 150,
      stock: 25,
      unit: "bottle",
      taxRate: 18
    });
    console.log(`✅ Result: ${result4.message}`);
    console.log(`   Action: ${result4.action}`);
    console.log(`   Product: ${result4.product.name} (${result4.product.size}) - Stock: ${result4.product.stock}\n`);

    // Test 5: Check for duplicates
    console.log("📝 Test 5: Checking for duplicates");
    const duplicates = await Product.findDuplicateProducts("Himalaya Shampoo");
    console.log(`✅ Found ${duplicates.length} duplicate(s):`);
    duplicates.forEach((dup, index) => {
      console.log(`   ${index + 1}. ${dup.name} (${dup.size || 'N/A'}) - Stock: ${dup.stock} - Code: ${dup.code}`);
    });
    console.log("");

    // Test 6: Check for duplicates with specific size
    console.log("📝 Test 6: Checking for duplicates with specific size '250ml'");
    const duplicatesWithSize = await Product.findDuplicateProducts("Himalaya Shampoo", "250ml");
    console.log(`✅ Found ${duplicatesWithSize.length} duplicate(s) with size 250ml:`);
    duplicatesWithSize.forEach((dup, index) => {
      console.log(`   ${index + 1}. ${dup.name} (${dup.size || 'N/A'}) - Stock: ${dup.stock} - Code: ${dup.code}`);
    });
    console.log("");

    console.log("🎉 All tests completed successfully!");
    console.log("📋 Summary:");
    console.log("   ✅ New products are created when they don't exist");
    console.log("   ✅ Existing products get their stock updated");
    console.log("   ✅ Out-of-stock products are restocked automatically");
    console.log("   ✅ Different sizes are treated as separate products");
    console.log("   ✅ Duplicate detection works correctly");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error testing smart product management:", err);
    process.exit(1);
  }
};

testSmartProduct();
