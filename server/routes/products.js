const express = require("express")
const Product = require("../models/Product")
const { auth, adminAuth } = require("../middleware/auth")

const router = express.Router()

// Get all products
router.get("/", auth, async (req, res) => {
  try {
    const { search, category, active } = req.query
    const query = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ]
    }

    if (category) {
      query.category = category
    }

    if (active !== undefined) {
      query.isActive = active === "true"
    }

    const products = await Product.find(query).sort({ name: 1 })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get product by code or barcode
router.get("/search/:identifier", auth, async (req, res) => {
  try {
    const { identifier } = req.params
    const product = await Product.findOne({
      $or: [{ code: identifier.toUpperCase() }, { barcode: identifier }],
      isActive: true,
    })

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create product (Admin only) - Smart product management
router.post("/", auth, adminAuth, async (req, res) => {
  try {
    const result = await Product.findOrCreateProduct(req.body)
    
    // Set appropriate status code based on action
    let statusCode = 201;
    if (result.action === 'exists' || result.action === 'stock_updated') {
      statusCode = 200;
    } else if (result.action === 'restocked') {
      statusCode = 200;
    }
    
    res.status(statusCode).json({
      product: result.product,
      action: result.action,
      message: result.message
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: "Product code or barcode already exists" })
    } else {
      res.status(500).json({ message: "Server error", error: error.message })
    }
  }
})

// Smart product add/restock endpoint (Admin only)
router.post("/smart", auth, adminAuth, async (req, res) => {
  try {
    const { name, size, stock, ...otherData } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: "Product name is required" });
    }
    
    // Check for potential duplicates
    const duplicates = await Product.findDuplicateProducts(name, size);
    
    if (duplicates.length > 0) {
      // If duplicates found, check if any are out of stock
      const outOfStockDuplicates = duplicates.filter(p => p.stock === 0);
      
      if (outOfStockDuplicates.length > 0) {
        // Restock the first out-of-stock duplicate
        const productToRestock = outOfStockDuplicates[0];
        productToRestock.stock += stock || 0;
        productToRestock.price = otherData.price || productToRestock.price;
        productToRestock.cost = otherData.cost || productToRestock.cost;
        productToRestock.isActive = true;
        
        await productToRestock.save();
        
        return res.status(200).json({
          product: productToRestock,
          action: 'restocked',
          message: 'Product was out of stock and has been restocked',
          duplicatesFound: duplicates.length
        });
      } else {
        // All duplicates have stock, return them for user decision
        return res.status(200).json({
          duplicates: duplicates,
          action: 'duplicates_found',
          message: 'Products with similar name already exist',
          suggestion: size 
            ? 'Consider using a different size or check if this is the same product'
            : 'Consider adding size information to create a variation'
        });
      }
    }
    
    // No duplicates found, create new product
    const result = await Product.findOrCreateProduct(req.body);
    
    res.status(201).json({
      product: result.product,
      action: result.action,
      message: result.message
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: "Product code or barcode already exists" })
    } else {
      res.status(500).json({ message: "Server error", error: error.message })
    }
  }
})

// Check for duplicate products (Admin only)
router.post("/check-duplicates", auth, adminAuth, async (req, res) => {
  try {
    const { name, size } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Product name is required" });
    }
    
    const duplicates = await Product.findDuplicateProducts(name, size);
    
    res.json({
      duplicates: duplicates,
      count: duplicates.length,
      message: duplicates.length > 0 
        ? `Found ${duplicates.length} similar product(s)` 
        : 'No similar products found'
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
})

// Update product (Admin only)
router.put("/:id", auth, adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete product (Admin only)
router.delete("/:id", auth, adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json({ message: "Product deactivated successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
