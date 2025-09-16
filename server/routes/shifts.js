const express = require("express")
const Shift = require("../models/Shift")
const Bill = require("../models/Bill")
const Employee = require("../models/Employee")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Start new shift
router.post("/start", auth, async (req, res) => {
  try {
    const { openingCash } = req.body

    // Check if user has active shift
    const activeShift = await Shift.findOne({
      cashier: req.user._id,
      status: "active",
    })

    if (activeShift) {
      return res.status(400).json({ message: "You already have an active shift" })
    }

    const shift = new Shift({
      cashier: req.user._id,
      cashierName: req.user.name,
      openingCash: openingCash || 0,
    })

    await shift.save()
    res.status(201).json(shift)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// End shift
router.post("/end", auth, async (req, res) => {
  try {
    const { closingCash, notes } = req.body

    const shift = await Shift.findOne({
      cashier: req.user._id,
      status: "active",
    })

    if (!shift) {
      return res.status(404).json({ message: "No active shift found" })
    }

    shift.endTime = new Date()
    shift.closingCash = closingCash
    shift.notes = notes
    shift.status = "closed"

    await shift.save()
    res.json(shift)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get current active shift
router.get("/current", auth, async (req, res) => {
  try {
    const shift = await Shift.findOne({
      cashier: req.user._id,
      status: "active",
    }).populate("cashier", "name employeeId")

    res.json(shift)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get shift history
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query
    const query = {}

    if (req.user.role !== "admin") {
      query.cashier = req.user._id
    }

    if (startDate || endDate) {
      query.startTime = {}
      if (startDate) query.startTime.$gte = new Date(startDate)
      if (endDate) query.startTime.$lte = new Date(endDate)
    }

    const shifts = await Shift.find(query)
      .populate("cashier", "name employeeId")
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Shift.countDocuments(query)

    res.json({
      shifts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Admin: Get all active shifts across all cashiers
router.get("/active", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    const activeShifts = await Shift.find({ status: "active" })
      .populate("cashier", "name employeeId")
      .sort({ startTime: -1 })

    res.json(activeShifts)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Admin: Get shift summary for a specific date range
router.get("/summary", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    const { startDate, endDate } = req.query
    const query = {}

    if (startDate || endDate) {
      query.startTime = {}
      if (startDate) query.startTime.$gte = new Date(startDate)
      if (endDate) query.startTime.$lte = new Date(endDate)
    }

    const shifts = await Shift.find(query).populate("cashier", "name employeeId")
    
    const summary = {
      totalShifts: shifts.length,
      activeShifts: shifts.filter(s => s.status === "active").length,
      closedShifts: shifts.filter(s => s.status === "closed").length,
      totalSales: shifts.reduce((sum, s) => sum + s.totalSales, 0),
      totalBills: shifts.reduce((sum, s) => sum + s.totalBills, 0),
      averageSalesPerShift: shifts.length > 0 ? shifts.reduce((sum, s) => sum + s.totalSales, 0) / shifts.length : 0,
      shiftsByCashier: {}
    }

    // Group shifts by cashier
    shifts.forEach(shift => {
      const cashierName = shift.cashier?.name || "Unknown"
      if (!summary.shiftsByCashier[cashierName]) {
        summary.shiftsByCashier[cashierName] = {
          totalShifts: 0,
          totalSales: 0,
          totalBills: 0
        }
      }
      summary.shiftsByCashier[cashierName].totalShifts++
      summary.shiftsByCashier[cashierName].totalSales += shift.totalSales
      summary.shiftsByCashier[cashierName].totalBills += shift.totalBills
    })

    res.json(summary)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Admin: Force end a shift (for emergency situations)
router.post("/:shiftId/end", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    const { closingCash, notes } = req.body
    const { shiftId } = req.params

    const shift = await Shift.findById(shiftId)

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" })
    }

    if (shift.status === "closed") {
      return res.status(400).json({ message: "Shift is already closed" })
    }

    shift.endTime = new Date()
    shift.closingCash = closingCash || shift.openingCash + shift.totalSales
    shift.notes = notes || `Force ended by admin: ${req.user.name}`
    shift.status = "closed"

    await shift.save()
    res.json(shift)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Admin: Get available cashiers for shift assignment
router.get("/available-cashiers", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    // Get all active employees with cashier role
    const cashiers = await Employee.find({
      "user.role": "cashier",
      status: "active"
    }).populate("user", "name email employeeId")

    // Get cashiers with active shifts
    const activeShiftCashiers = await Shift.find({
      status: "active"
    }).select("cashier")

    const activeCashierIds = activeShiftCashiers.map(s => s.cashier.toString())

    const availableCashiers = cashiers.filter(cashier => 
      !activeCashierIds.includes(cashier.user._id.toString())
    )

    res.json({
      allCashiers: cashiers,
      availableCashiers: availableCashiers,
      activeShiftCashiers: activeCashierIds.length
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Admin: Assign temporary cashier for absent employee
router.post("/assign-temporary", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    const { absentCashierId, temporaryCashierId, reason } = req.body

    if (!absentCashierId || !temporaryCashierId || !reason) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (absentCashierId === temporaryCashierId) {
      return res.status(400).json({ message: "Absent and temporary cashiers cannot be the same" })
    }

    // Check if absent cashier has an active shift
    const absentShift = await Shift.findOne({
      cashier: absentCashierId,
      status: "active"
    })

    if (!absentShift) {
      return res.status(400).json({ message: "Absent cashier does not have an active shift" })
    }

    // Check if temporary cashier already has an active shift
    const temporaryActiveShift = await Shift.findOne({
      cashier: temporaryCashierId,
      status: "active"
    })

    if (temporaryActiveShift) {
      return res.status(400).json({ message: "Temporary cashier already has an active shift" })
    }

    // End the absent cashier's shift
    absentShift.status = "closed"
    absentShift.endTime = new Date()
    absentShift.notes = `Shift ended due to absence: ${reason} - Temporary replacement assigned by admin: ${req.user.name}`
    await absentShift.save()

    // Create new shift for temporary cashier
    const temporaryShift = new Shift({
      cashier: temporaryCashierId,
      cashierName: (await Employee.findOne({ user: temporaryCashierId }).populate("user", "name")).user.name,
      openingCash: absentShift.openingCash,
      notes: `Temporary replacement for ${absentShift.cashierName} - Reason: ${reason} - Assigned by admin: ${req.user.name}`
    })

    await temporaryShift.save()

    res.json({
      message: "Temporary cashier assigned successfully",
      absentShift: absentShift,
      temporaryShift: temporaryShift
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
