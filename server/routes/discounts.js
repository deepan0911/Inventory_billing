const express = require("express")
const router = express.Router()
const Discount = require("../models/Discount")
const Product = require("../models/Product")
const { auth } = require("../middleware/auth")

// Get all discounts with pagination and filtering
router.get("/", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      targetType = "",
      isActive = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query

    const query = {}

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ]
    }

    // Filter by target type
    if (targetType) {
      query.targetType = targetType
    }

    // Filter by active status
    if (isActive !== "") {
      query.isActive = isActive === "true"
    }

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1

    const discounts = await Discount.find(query)
      .populate("targetProduct", "code name category")
      .populate("createdBy", "name email")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Discount.countDocuments(query)

    res.json({
      discounts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    })
  } catch (error) {
    console.error("Error fetching discounts:", error)
    res.status(500).json({ message: "Error fetching discounts" })
  }
})

// Get discount by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate("targetProduct", "code name category")
      .populate("createdBy", "name email")

    if (!discount) {
      return res.status(404).json({ message: "Discount not found" })
    }

    res.json(discount)
  } catch (error) {
    console.error("Error fetching discount:", error)
    res.status(500).json({ message: "Error fetching discount" })
  }
})

// Create new discount
router.post("/", auth, async (req, res) => {
  try {
    const discountData = {
      ...req.body,
      createdBy: req.user.id,
    }

    const discount = new Discount(discountData)
    await discount.save()

    // Populate references for response
    await discount.populate("targetProduct", "code name category")
    await discount.populate("createdBy", "name email")

    res.status(201).json(discount)
  } catch (error) {
    console.error("Error creating discount:", error)
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message)
      return res.status(400).json({ message: messages.join(", ") })
    }
    res.status(500).json({ message: "Error creating discount" })
  }
})

// Update discount
router.put("/:id", auth, async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)

    if (!discount) {
      return res.status(404).json({ message: "Discount not found" })
    }

    // Update discount fields
    Object.assign(discount, req.body)
    await discount.save()

    // Populate references for response
    await discount.populate("targetProduct", "code name category")
    await discount.populate("createdBy", "name email")

    res.json(discount)
  } catch (error) {
    console.error("Error updating discount:", error)
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message)
      return res.status(400).json({ message: messages.join(", ") })
    }
    res.status(500).json({ message: "Error updating discount" })
  }
})

// Delete discount
router.delete("/:id", auth, async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)

    if (!discount) {
      return res.status(404).json({ message: "Discount not found" })
    }

    await Discount.findByIdAndDelete(req.params.id)
    res.json({ message: "Discount deleted successfully" })
  } catch (error) {
    console.error("Error deleting discount:", error)
    res.status(500).json({ message: "Error deleting discount" })
  }
})

// Get applicable discounts for a product
router.get("/applicable/:productId", auth, async (req, res) => {
  try {
    console.log("🔍 Fetching applicable discounts for product ID:", req.params.productId)
    
    const product = await Product.findById(req.params.productId)
    console.log("Found product:", product ? "Yes" : "No")

    if (!product) {
      console.log("Product not found for ID:", req.params.productId)
      return res.status(404).json({ message: "Product not found" })
    }

    console.log("Product details:", {
      id: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      isActive: product.isActive
    })

    const applicableDiscounts = await Discount.findApplicableDiscounts(product)
    console.log("Found applicable discounts:", applicableDiscounts.length)
    
    if (applicableDiscounts.length === 0) {
      console.log("🔍 Debugging: No applicable discounts found")
      
      // Let's check all discounts to see why none are applicable
      const allDiscounts = await Discount.find({})
      console.log(`Total discounts in database: ${allDiscounts.length}`)
      
      const now = new Date()
      console.log(`Current time: ${now}`)
      
      for (const discount of allDiscounts) {
        console.log(`\nChecking discount: ${discount.name}`)
        console.log(`  Active: ${discount.isActive}`)
        console.log(`  Start: ${discount.startDate}`)
        console.log(`  End: ${discount.endDate}`)
        console.log(`  Target: ${discount.targetType}`)
        console.log(`  Category: ${discount.targetCategory || 'N/A'}`)
        console.log(`  Product: ${discount.targetProduct || 'N/A'}`)
        console.log(`  Usage: ${discount.usedCount || 0}/${discount.usageLimit || 'Unlimited'}`)
        
        // Check if this discount should be applicable
        const isApplicable = discount.isActive && 
          new Date(discount.startDate) <= now && 
          new Date(discount.endDate) >= now &&
          (discount.targetType === "all" || 
           (discount.targetType === "category" && discount.targetCategory === product.category) ||
           (discount.targetType === "product" && discount.targetProduct?.toString() === product._id.toString())) &&
          (!discount.usageLimit || discount.usedCount < discount.usageLimit)
        
        console.log(`  Should be applicable: ${isApplicable}`)
      }
    }
    
    res.json(applicableDiscounts)
  } catch (error) {
    console.error("Error fetching applicable discounts:", error)
    console.error("Error stack:", error.stack)
    res.status(500).json({ message: "Error fetching applicable discounts" })
  }
})

// Get best discount for a product
router.get("/best/:productId", auth, async (req, res) => {
  try {
    const { quantity = 1 } = req.query
    const product = await Product.findById(req.params.productId)

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    const bestDiscount = await Discount.findBestDiscount(product, parseInt(quantity))
    res.json(bestDiscount)
  } catch (error) {
    console.error("Error fetching best discount:", error)
    res.status(500).json({ message: "Error fetching best discount" })
  }
})

// Get discount statistics
router.get("/stats/overview", auth, async (req, res) => {
  try {
    const totalDiscounts = await Discount.countDocuments()
    const activeDiscounts = await Discount.countDocuments({ isActive: true })
    const expiredDiscounts = await Discount.countDocuments({ 
      endDate: { $lt: new Date() } 
    })
    const usageLimitReached = await Discount.countDocuments({
      $expr: { $gte: ["$usedCount", "$usageLimit"] }
    })

    const totalUsage = await Discount.aggregate([
      { $group: { _id: null, totalUsed: { $sum: "$usedCount" } } }
    ])

    const discountTypes = await Discount.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ])

    const targetTypes = await Discount.aggregate([
      { $group: { _id: "$targetType", count: { $sum: 1 } } }
    ])

    res.json({
      totalDiscounts,
      activeDiscounts,
      expiredDiscounts,
      usageLimitReached,
      totalUsage: totalUsage[0]?.totalUsed || 0,
      discountTypes,
      targetTypes,
    })
  } catch (error) {
    console.error("Error fetching discount statistics:", error)
    res.status(500).json({ message: "Error fetching discount statistics" })
  }
})

// Toggle discount active status
router.patch("/:id/toggle", auth, async (req, res) => {
  try {
    console.log("Toggle request for discount ID:", req.params.id)
    
    const discount = await Discount.findById(req.params.id)
    console.log("Found discount:", discount ? "Yes" : "No")

    if (!discount) {
      return res.status(404).json({ message: "Discount not found" })
    }

    console.log("Current isActive status:", discount.isActive)
    discount.isActive = !discount.isActive
    console.log("New isActive status:", discount.isActive)
    
    // Check for potential validation issues before saving
    const validationErrors = discount.validateSync()
    if (validationErrors) {
      console.error("Validation errors before save:", validationErrors.errors)
    }
    
    await discount.save()
    console.log("Discount saved successfully")

    // Safely populate references
    try {
      await discount.populate("targetProduct", "code name category")
    } catch (populateError) {
      console.warn("Warning: Could not populate targetProduct:", populateError.message)
    }
    
    try {
      await discount.populate("createdBy", "name email")
    } catch (populateError) {
      console.warn("Warning: Could not populate createdBy:", populateError.message)
    }

    res.json(discount)
  } catch (error) {
    console.error("Error toggling discount status:", error)
    console.error("Error stack:", error.stack)
    res.status(500).json({ message: "Error toggling discount status" })
  }
})

module.exports = router
