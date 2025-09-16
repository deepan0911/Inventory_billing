const express = require("express")
const Bill = require("../models/Bill")
const Product = require("../models/Product")
const Shift = require("../models/Shift")
const { auth, adminAuth } = require("../middleware/auth")

const router = express.Router()

// Sales Summary Report
router.get("/sales-summary", auth, async (req, res) => {
  try {
    const { startDate, endDate, period = "daily" } = req.query

    const matchStage = {
      status: "completed",
    }

    if (startDate || endDate) {
      matchStage.createdAt = {}
      if (startDate) matchStage.createdAt.$gte = new Date(startDate)
      if (endDate) matchStage.createdAt.$lte = new Date(endDate)
    }

    // Get date grouping format based on period
    let dateFormat
    switch (period) {
      case "hourly":
        dateFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
          hour: { $hour: "$createdAt" },
        }
        break
      case "weekly":
        dateFormat = {
          year: { $year: "$createdAt" },
          week: { $week: "$createdAt" },
        }
        break
      case "monthly":
        dateFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        }
        break
      default: // daily
        dateFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        }
    }

    const salesData = await Bill.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: dateFormat,
          totalSales: { $sum: "$grandTotal" },
          totalBills: { $count: {} },
          totalItems: { $sum: { $size: "$items" } },
          totalDiscount: { $sum: "$totalDiscount" },
          totalTax: { $sum: "$totalTax" },
          avgBillValue: { $avg: "$grandTotal" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
    ])

    // Get overall totals
    const totals = await Bill.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$grandTotal" },
          totalBills: { $count: {} },
          totalItems: { $sum: { $size: "$items" } },
          totalDiscount: { $sum: "$totalDiscount" },
          totalTax: { $sum: "$totalTax" },
          avgBillValue: { $avg: "$grandTotal" },
        },
      },
    ])

    res.json({
      salesData,
      totals: totals[0] || {
        totalSales: 0,
        totalBills: 0,
        totalItems: 0,
        totalDiscount: 0,
        totalTax: 0,
        avgBillValue: 0,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Top Products Report
router.get("/top-products", auth, async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query

    const matchStage = {
      status: "completed",
    }

    if (startDate || endDate) {
      matchStage.createdAt = {}
      if (startDate) matchStage.createdAt.$gte = new Date(startDate)
      if (endDate) matchStage.createdAt.$lte = new Date(endDate)
    }

    const topProducts = await Bill.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: {
            productId: "$items.product",
            productName: "$items.productName",
            productCode: "$items.productCode",
          },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalAmount" },
          totalOrders: { $count: {} },
          avgPrice: { $avg: "$items.rate" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: Number.parseInt(limit) },
    ])

    res.json(topProducts)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Cashier Performance Report
router.get("/cashier-performance", auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const matchStage = {
      status: "completed",
    }

    if (startDate || endDate) {
      matchStage.createdAt = {}
      if (startDate) matchStage.createdAt.$gte = new Date(startDate)
      if (endDate) matchStage.createdAt.$lte = new Date(endDate)
    }

    const cashierPerformance = await Bill.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            cashierId: "$cashier",
            cashierName: "$cashierName",
          },
          totalSales: { $sum: "$grandTotal" },
          totalBills: { $count: {} },
          totalItems: { $sum: { $size: "$items" } },
          avgBillValue: { $avg: "$grandTotal" },
          totalDiscount: { $sum: "$totalDiscount" },
        },
      },
      { $sort: { totalSales: -1 } },
    ])

    res.json(cashierPerformance)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Inventory Report
router.get("/inventory", auth, adminAuth, async (req, res) => {
  try {
    const { category, lowStock = false } = req.query

    const matchStage = { isActive: true }
    if (category) matchStage.category = category
    if (lowStock === "true") matchStage.stock = { $lt: 10 }

    const inventory = await Product.find(matchStage).sort({ stock: 1 })

    // Get inventory value
    const inventoryValue = inventory.reduce((total, product) => {
      return total + product.stock * product.cost
    }, 0)

    // Get low stock count
    const lowStockCount = await Product.countDocuments({
      isActive: true,
      stock: { $lt: 10 },
    })

    // Get out of stock count
    const outOfStockCount = await Product.countDocuments({
      isActive: true,
      stock: 0,
    })

    res.json({
      products: inventory,
      summary: {
        totalProducts: inventory.length,
        inventoryValue,
        lowStockCount,
        outOfStockCount,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Payment Methods Report
router.get("/payment-methods", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const matchStage = {
      status: "completed",
    }

    if (startDate || endDate) {
      matchStage.createdAt = {}
      if (startDate) matchStage.createdAt.$gte = new Date(startDate)
      if (endDate) matchStage.createdAt.$lte = new Date(endDate)
    }

    const paymentMethods = await Bill.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$paymentMethod",
          totalAmount: { $sum: "$grandTotal" },
          totalTransactions: { $count: {} },
          avgTransactionValue: { $avg: "$grandTotal" },
        },
      },
      { $sort: { totalAmount: -1 } },
    ])

    res.json(paymentMethods)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
