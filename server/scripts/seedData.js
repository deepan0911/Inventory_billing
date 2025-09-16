// ✅ Load environment variables FIRST
require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const connectDB = require("../config/database");

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing users (but keep other data)
    await User.deleteMany({});

    // Hash passwords before saving
    const adminPassword   = await bcrypt.hash("admin123",   10);
    const cashierPassword = await bcrypt.hash("cashier123", 10);

    // Create admin & cashier users
    await User.insertMany([
      {
        name: "Admin User",
        email: "admin@supermarket.com",
        password: adminPassword,
        role: "admin",
        employeeId: "EMP001",
      },
      {
        name: "John Cashier",
        email: "cashier@supermarket.com",
        password: cashierPassword,
        role: "cashier",
        employeeId: "EMP002",
      }
    ]);

    console.log("✅ Admin and Cashier users created successfully!");
    console.log("Admin Login : admin@supermarket.com / admin123");
    console.log("Cashier Login: cashier@supermarket.com / cashier123");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding data:", err);
    process.exit(1);
  }
};

seedData();
