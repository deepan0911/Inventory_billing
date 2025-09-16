const mongoose = require("mongoose")

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    personalDetails: {
      firstName: {
        type: String,
        required: true,
        trim: true,
      },
      lastName: {
        type: String,
        required: true,
        trim: true,
      },
      dateOfBirth: {
        type: Date,
        required: true,
      },
      gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: true,
      },
      bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      },
    },
    contactDetails: {
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      emergencyPhone: {
        type: String,
        trim: true,
      },
      address: {
        street: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        postalCode: {
          type: String,
          required: true,
        },
        country: {
          type: String,
          default: "India",
        },
      },
    },
    identification: {
      aadhaarNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      panNumber: {
        type: String,
        unique: true,
        trim: true,
      },
      aadhaarCard: {
        filename: String,
        path: String,
        uploadedAt: Date,
      },
      panCard: {
        filename: String,
        path: String,
        uploadedAt: Date,
      },
      photo: {
        filename: String,
        path: String,
        uploadedAt: Date,
      },
    },
    employmentDetails: {
      department: {
        type: String,
        required: true,
        enum: ["cashier", "manager", "supervisor", "stock"],
      },
      position: {
        type: String,
        required: true,
      },
      dateOfJoining: {
        type: Date,
        required: true,
      },
      salary: {
        type: Number,
        required: true,
      },
      bankAccount: {
        accountNumber: String,
        bankName: String,
        ifscCode: String,
        branchName: String,
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "on_leave", "terminated"],
      default: "active",
    },
    leaveBalance: {
      casual: {
        type: Number,
        default: 12,
      },
      sick: {
        type: Number,
        default: 12,
      },
      earned: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
)

// Virtual for full name
employeeSchema.virtual("fullName").get(function () {
  return `${this.personalDetails.firstName} ${this.personalDetails.lastName}`
})

// Index for better search performance
employeeSchema.index({ "personalDetails.firstName": 1, "personalDetails.lastName": 1 })
employeeSchema.index({ "identification.aadhaarNumber": 1 })
employeeSchema.index({ "contactDetails.phone": 1 })
employeeSchema.index({ status: 1 })

module.exports = mongoose.model("Employee", employeeSchema)
