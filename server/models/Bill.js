const mongoose = require("mongoose")

const billItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantSku: String,
  variantSize: String,
  productCode: String,
  productName: String,
  quantity: {
    type: Number,
    required: true,
    min: 0.01,
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  amount: {
    type: Number,
    required: true,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  discount: {
    discountId: String,
    discountName: String,
    discountType: String,
    discountValue: Number,
    discountAmount: Number,
  },
})

const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      name: String,
      phone: String,
      address: String,
      gstNumber: String,
    },
    items: [billItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    roundOff: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    cashTendered: {
      type: Number,
      default: 0,
    },
    changeDue: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "mixed"],
      default: "cash",
    },
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cashierName: String,
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
    },
    status: {
      type: String,
      enum: ["completed", "cancelled", "refunded"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  },
)

// Generate bill number
billSchema.pre("validate", async function (next) {
  if (!this.billNumber) {
    try {
      const today = new Date()
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
      const count = await this.constructor.countDocuments({
        createdAt: {
          $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      })
      const random = Math.floor(Math.random() * 10000);
this.billNumber = `BILL${dateStr}${String(random).padStart(4,"0")}`;

    } catch (err) {
      return next(err)
    }
  }
  next()
})




module.exports = mongoose.model("Bill", billSchema)
