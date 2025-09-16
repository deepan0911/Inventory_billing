require("dotenv").config({ path: ".env.local" });   // ✅ Load env vars first
require("dotenv").config(); // Also load from .env in server directory
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/database");
const { startStockMonitoring } = require("./services/scheduler");

// Import routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const billRoutes = require("./routes/bills");
const shiftRoutes = require("./routes/shifts");
const reportRoutes = require("./routes/reports");
const stockRoutes = require("./routes/stock");
const employeeRoutes = require("./routes/employees");
const leaveRoutes = require("./routes/leaves");
const discountRoutes = require("./routes/discounts");

const app = express();

// ✅ Connect to database AFTER env vars are loaded
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/discounts", discountRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "Supermarket POS API is running!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  
  // Start stock monitoring scheduler
  startStockMonitoring(60); // Monitor every 60 minutes
});

module.exports = app;
