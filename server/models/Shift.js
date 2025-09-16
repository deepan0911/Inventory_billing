const mongoose = require("mongoose")

const shiftSchema = new mongoose.Schema(
  {
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cashierName: String,
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: Date,
    openingCash: {
      type: Number,
      required: true,
      default: 0,
    },
    closingCash: Number,
    totalSales: {
      type: Number,
      default: 0,
    },
    totalBills: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
    notes: String,
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Shift", shiftSchema)
