const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const Employee = require("../models/Employee")
const Leave = require("../models/Leave")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/leaves")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only JPEG, JPG, PNG, and PDF files are allowed!"))
    }
  }
})

// Get all leave requests (Admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const { status, employee } = req.query
    const filter = {}
    
    if (status) filter.status = status
    if (employee) filter.employee = employee

    const leaves = await Leave.find(filter)
      .populate("employee", "personalDetails.firstName personalDetails.lastName")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 })

    res.json(leaves)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get current user's leave requests
router.get("/my-leaves", auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id })
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" })
    }

    const leaves = await Leave.find({ employee: employee._id })
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 })

    res.json(leaves)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get leave request by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate("employee", "personalDetails.firstName personalDetails.lastName user")
      .populate("approvedBy", "name")

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" })
    }

    // Check if user is admin or the employee themselves
    const employee = await Employee.findOne({ user: req.user.id })
    if (req.user.role !== "admin" && (!employee || employee._id.toString() !== leave.employee._id.toString())) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(leave)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create new leave request
router.post("/", auth, upload.array("documents", 5), async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id })
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" })
    }

    const {
      leaveType,
      startDate,
      endDate,
      reason,
      isHalfDay,
      halfDayType,
      emergencyContact
    } = req.body

    // Check for overlapping leave requests
    const overlappingLeaves = await Leave.find({
      employee: employee._id,
      status: { $in: ["pending", "approved"] },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ]
    })

    if (overlappingLeaves.length > 0) {
      return res.status(400).json({ message: "You already have a leave request for this period" })
    }

    // Check leave balance
    const diffTime = Math.abs(new Date(endDate) - new Date(startDate))
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    const totalDays = isHalfDay === "true" ? diffDays * 0.5 : diffDays

    const leaveBalance = employee.leaveBalance
    if (leaveType === "casual" && leaveBalance.casual < totalDays) {
      return res.status(400).json({ message: "Insufficient casual leave balance" })
    }
    if (leaveType === "sick" && leaveBalance.sick < totalDays) {
      return res.status(400).json({ message: "Insufficient sick leave balance" })
    }

    const leave = new Leave({
      employee: employee._id,
      employeeName: `${employee.personalDetails.firstName} ${employee.personalDetails.lastName}`,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      isHalfDay: isHalfDay === "true",
      halfDayType,
      emergencyContact: emergencyContact ? JSON.parse(emergencyContact) : undefined,
      documents: req.files.map(file => ({
        filename: file.filename,
        path: file.path,
        uploadedAt: new Date()
      }))
    })

    await leave.save()

    res.status(201).json({
      message: "Leave request submitted successfully",
      leave
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Approve leave request (Admin only)
router.put("/:id/approve", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const leave = await Leave.findById(req.params.id)
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" })
    }

    if (leave.status !== "pending") {
      return res.status(400).json({ message: "Leave request is not pending" })
    }

    // Update leave status
    leave.status = "approved"
    leave.approvedBy = req.user.id
    leave.approvedAt = new Date()

    await leave.save()

    // Update employee leave balance
    const employee = await Employee.findById(leave.employee)
    if (employee) {
      if (leave.leaveType === "casual") {
        employee.leaveBalance.casual -= leave.totalDays
      } else if (leave.leaveType === "sick") {
        employee.leaveBalance.sick -= leave.totalDays
      }
      await employee.save()
    }

    res.json({
      message: "Leave request approved successfully",
      leave
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Reject leave request (Admin only)
router.put("/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const { rejectedReason } = req.body
    if (!rejectedReason) {
      return res.status(400).json({ message: "Rejection reason is required" })
    }

    const leave = await Leave.findById(req.params.id)
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" })
    }

    if (leave.status !== "pending") {
      return res.status(400).json({ message: "Leave request is not pending" })
    }

    // Update leave status
    leave.status = "rejected"
    leave.rejectedReason = rejectedReason

    await leave.save()

    res.json({
      message: "Leave request rejected successfully",
      leave
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Cancel leave request
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" })
    }

    const employee = await Employee.findOne({ user: req.user.id })
    if (!employee || employee._id.toString() !== leave.employee._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    if (leave.status !== "pending") {
      return res.status(400).json({ message: "Only pending leave requests can be cancelled" })
    }

    // Update leave status
    leave.status = "cancelled"
    await leave.save()

    res.json({
      message: "Leave request cancelled successfully",
      leave
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get leave statistics (Admin only)
router.get("/stats/overview", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const stats = await Leave.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ])

    const leaveTypeStats = await Leave.aggregate([
      {
        $group: {
          _id: "$leaveType",
          count: { $sum: 1 }
        }
      }
    ])

    res.json({
      statusStats: stats,
      leaveTypeStats: leaveTypeStats
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
