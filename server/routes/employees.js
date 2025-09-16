const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const User = require("../models/User")
const Employee = require("../models/Employee")
const Leave = require("../models/Leave")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/employees")
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

// Get all employees (Admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const employees = await Employee.find()
      .populate("user", "name email employeeId role isActive")
      .sort({ createdAt: -1 })

    res.json(employees)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get employee by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("user", "name email employeeId role isActive")

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    // Check if user is admin or the employee themselves
    if (req.user.role !== "admin" && employee.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(employee)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create new employee (Admin only)
router.post("/", auth, upload.fields([
  { name: "aadhaarCard", maxCount: 1 },
  { name: "panCard", maxCount: 1 },
  { name: "photo", maxCount: 1 }
]), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const {
      email,
      password,
      role,
      employeeId,
      personalDetails,
      contactDetails,
      identification,
      employmentDetails
    } = req.body

    // Parse JSON fields
    const parsedPersonalDetails = JSON.parse(personalDetails)
    const parsedContactDetails = JSON.parse(contactDetails)
    const parsedIdentification = JSON.parse(identification)
    const parsedEmploymentDetails = JSON.parse(employmentDetails)

    // Log received data for debugging
    console.log('Received employee data:', {
      email,
      employeeId,
      role,
      personalDetails: parsedPersonalDetails,
      contactDetails: parsedContactDetails,
      identification: parsedIdentification,
      employmentDetails: parsedEmploymentDetails,
      files: req.files
    })

    // Create user first
    const user = new User({
      name: `${parsedPersonalDetails.firstName} ${parsedPersonalDetails.lastName}`,
      email,
      password,
      role,
      employeeId,
    })

    try {
      await user.save()
    } catch (userError) {
      if (userError.code === 11000) {
        // Duplicate key error
        const field = Object.keys(userError.keyPattern)[0]
        return res.status(400).json({ 
          message: `User with this ${field} already exists` 
        })
      }
      throw userError
    }

    // Create employee record
    const employee = new Employee({
      user: user._id,
      personalDetails: parsedPersonalDetails,
      contactDetails: parsedContactDetails,
      identification: {
        ...parsedIdentification,
        aadhaarCard: req.files["aadhaarCard"]?.[0] ? {
          filename: req.files["aadhaarCard"][0].filename,
          path: req.files["aadhaarCard"][0].path,
          uploadedAt: new Date()
        } : undefined,
        panCard: req.files["panCard"]?.[0] ? {
          filename: req.files["panCard"][0].filename,
          path: req.files["panCard"][0].path,
          uploadedAt: new Date()
        } : undefined,
        photo: req.files["photo"]?.[0] ? {
          filename: req.files["photo"][0].filename,
          path: req.files["photo"][0].path,
          uploadedAt: new Date()
        } : undefined
      },
      employmentDetails: parsedEmploymentDetails
    })

    try {
      await employee.save()
    } catch (employeeError) {
      // If employee creation fails, delete the user we just created
      await User.findByIdAndDelete(user._id)
      throw employeeError
    }

    res.status(201).json({
      message: "Employee created successfully",
      employee: await employee.populate("user", "name email employeeId role")
    })
  } catch (error) {
    console.error('Employee creation error:', error)
    if (error.code === 11000) {
      // This should have been caught earlier, but just in case
      const field = Object.keys(error.keyPattern)[0]
      return res.status(400).json({ message: `User with this ${field} already exists` })
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message)
      return res.status(400).json({ message: messages.join(', ') })
    }
    res.status(500).json({ message: error.message || "Server error" })
  }
})

// Update employee (Admin only)
router.put("/:id", auth, upload.fields([
  { name: "aadhaarCard", maxCount: 1 },
  { name: "panCard", maxCount: 1 },
  { name: "photo", maxCount: 1 }
]), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const employee = await Employee.findById(req.params.id)
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    const {
      personalDetails,
      contactDetails,
      identification,
      employmentDetails,
      status
    } = req.body

    // Update fields
    if (personalDetails) {
      employee.personalDetails = JSON.parse(personalDetails)
    }
    if (contactDetails) {
      employee.contactDetails = JSON.parse(contactDetails)
    }
    if (identification) {
      const parsedIdentification = JSON.parse(identification)
      employee.identification = { ...employee.identification, ...parsedIdentification }
      
      // Handle file uploads
      if (req.files["aadhaarCard"]?.[0]) {
        employee.identification.aadhaarCard = {
          filename: req.files["aadhaarCard"][0].filename,
          path: req.files["aadhaarCard"][0].path,
          uploadedAt: new Date()
        }
      }
      if (req.files["panCard"]?.[0]) {
        employee.identification.panCard = {
          filename: req.files["panCard"][0].filename,
          path: req.files["panCard"][0].path,
          uploadedAt: new Date()
        }
      }
      if (req.files["photo"]?.[0]) {
        employee.identification.photo = {
          filename: req.files["photo"][0].filename,
          path: req.files["photo"][0].path,
          uploadedAt: new Date()
        }
      }
    }
    if (employmentDetails) {
      employee.employmentDetails = JSON.parse(employmentDetails)
    }
    if (status) {
      employee.status = status
    }

    await employee.save()

    res.json({
      message: "Employee updated successfully",
      employee: await employee.populate("user", "name email employeeId role")
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete employee (Admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    const employee = await Employee.findById(req.params.id)
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    // Deactivate user instead of deleting
    const user = await User.findById(employee.user)
    if (user) {
      user.isActive = false
      await user.save()
    }

    employee.status = "inactive"
    await employee.save()

    res.json({ message: "Employee deactivated successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get employee leave requests
router.get("/:id/leaves", auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    // Check if user is admin or the employee themselves
    if (req.user.role !== "admin" && employee.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    const leaves = await Leave.find({ employee: req.params.id })
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 })

    res.json(leaves)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
