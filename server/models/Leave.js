const mongoose = require("mongoose")

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeName: String,
    leaveType: {
      type: String,
      enum: ["casual", "sick", "earned", "maternity", "paternity", "unpaid"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    rejectedReason: String,
    documents: [
      {
        filename: String,
        path: String,
        uploadedAt: Date,
      },
    ],
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    halfDayType: {
      type: String,
      enum: ["first_half", "second_half"],
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
  },
  {
    timestamps: true,
  }
)

// Virtual for checking if leave is overlapping
leaveSchema.virtual("isOverlapping").get(function () {
  // This will be implemented in the API layer
  return false
})

// Pre-save hook to calculate total days
leaveSchema.pre("save", function (next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    this.totalDays = this.isHalfDay ? diffDays * 0.5 : diffDays
  }
  next()
})

// Index for better query performance
leaveSchema.index({ employee: 1, status: 1 })
leaveSchema.index({ startDate: 1, endDate: 1 })
leaveSchema.index({ status: 1 })

module.exports = mongoose.model("Leave", leaveSchema)
