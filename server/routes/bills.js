const express = require("express");
const Bill = require("../models/Bill");
const Product = require("../models/Product");
const Shift = require("../models/Shift");
const Discount = require("../models/Discount");
const { auth } = require("../middleware/auth");
const { checkProductStock } = require("../services/stockMonitor");

const router = express.Router();

/**
 * POST /api/bills
 * Create a new bill
 */
router.post("/", auth, async (req, res) => {
  try {
    const { items, customer, cashTendered = 0, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided for the bill." });
    }

    // Totals
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    const discountUsageMap = new Map(); // Track discount usage for recording

    const processedItems = await Promise.all(
      items.map(async (item) => {
        if (!item.product) {
          throw new Error("Each item must include a product id");
        }

        const product = await Product.findById(item.product).lean();
        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }

        // Handle variant selection
        let selectedVariant = null;
        let variantSize = "Default";
        let variantPrice = Number(item.rate);
        
        if (item.variant && product.variants && product.variants.length > 0) {
          selectedVariant = product.variants.find(v => v.sku === item.variant);
          if (!selectedVariant) {
            throw new Error(`Variant not found: ${item.variant} for product: ${product.name}`);
          }
          
          // Check if variant is active
          if (!selectedVariant.isActive) {
            throw new Error(`Variant ${item.variant} is not active for product: ${product.name}`);
          }
          
          // Check stock
          if (selectedVariant.stock < item.quantity) {
            throw new Error(`Insufficient stock for variant ${item.variant}. Available: ${selectedVariant.stock}, Required: ${item.quantity}`);
          }
          
          variantSize = selectedVariant.size;
          variantPrice = selectedVariant.price;
        } else {
          // Fallback for old product structure
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`);
          }
        }

        // Find the best applicable discount for this product
        const bestDiscount = await Discount.findBestDiscountForProduct(
          product._id,
          item.quantity
        );

        const amount = Number(item.quantity) * variantPrice;
        let discountAmount = 0;
        let discountInfo = null;

        if (bestDiscount) {
          discountAmount = bestDiscount.discountAmount;
          discountInfo = {
            discountId: bestDiscount.discount._id,
            discountName: bestDiscount.discount.name,
            discountType: bestDiscount.discount.type,
            discountValue: bestDiscount.discount.value,
            discountAmount: bestDiscount.discountAmount
          };

          // Track discount usage
          const discountId = bestDiscount.discount._id.toString();
          discountUsageMap.set(discountId, (discountUsageMap.get(discountId) || 0) + 1);
        }

        const discountedAmount = amount - discountAmount;
        const taxAmount = discountedAmount * (Number(item.taxRate) / 100);
        const totalAmount = discountedAmount + taxAmount;

        subtotal += discountedAmount;
        totalTax += taxAmount;
        totalDiscount += discountAmount;

        return {
          ...item,
          productCode: product.code,
          productName: product.name,
          variantSize: variantSize,
          variantSku: item.variant || null,
          amount: discountedAmount,
          taxAmount,
          totalAmount,
          discount: discountInfo
        };
      })
    );

    // Record discount usage
    for (const [discountId, usageCount] of discountUsageMap) {
      await Discount.recordUsage(discountId, usageCount);
    }

    const grandTotal = subtotal + totalTax;
    const roundOff = Math.round(grandTotal) - grandTotal;
    const finalTotal = Math.round(grandTotal);
    const changeDue = Math.max(0, cashTendered - finalTotal);

    // Active shift for the cashier, if any
    const activeShift = await Shift.findOne({
      cashier: req.user._id,
      status: "active",
    }).lean();

    const bill = new Bill({
      items: processedItems,
      customer,
      subtotal,
      totalDiscount,
      totalTax,
      roundOff,
      grandTotal: finalTotal,
      cashTendered,
      changeDue,
      paymentMethod,
      cashier: req.user._id,
      cashierName: req.user.name,
      shift: activeShift?._id,
    });

    await bill.save();

    // Update shift totals if shift is active
    if (activeShift) {
      await Shift.findByIdAndUpdate(activeShift._id, {
        $inc: { totalSales: finalTotal, totalBills: 1 },
      });
    }

    // Decrement product stock and check for low/out of stock
    for (const item of processedItems) {
      if (item.variantSku) {
        // Update variant stock
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.product, "variants.sku": item.variantSku },
          { $inc: { "variants.$.stock": -item.quantity } },
          { new: true }
        );
        
        if (!updatedProduct) {
          throw new Error(`Failed to update stock for variant: ${item.variantSku}`);
        }
      } else {
        // Fallback for old product structure
        const updatedProduct = await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        }, { new: true });
        
        if (!updatedProduct) {
          throw new Error(`Failed to update stock for product: ${item.productName}`);
        }
      }
      
      // Check stock levels after update and send notifications if needed
      await checkProductStock(item.product);
    }

    await bill.populate("items.product");
    res.status(201).json(bill);
  } catch (error) {
    console.error("Error creating bill:", error);
    res.status(500).json({
      message: "Failed to create bill",
      error: error.message,
    });
  }
});

/**
 * GET /api/bills
 * List bills with search and pagination
 */
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, startDate, endDate, cashier, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (cashier) query.cashier = cashier;
    if (status) query.status = status;

    const bills = await Bill.find(query)
      .populate("cashier", "name employeeId")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Bill.countDocuments(query);

    res.json({
      bills,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({ message: "Failed to fetch bills", error: error.message });
  }
});

/**
 * GET /api/bills/:id
 * Retrieve a single bill by ID
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate("items.product")
      .populate("cashier", "name employeeId");

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(bill);
  } catch (error) {
    console.error("Error fetching bill:", error);
    res.status(500).json({ message: "Failed to fetch bill", error: error.message });
  }
});

module.exports = router;
