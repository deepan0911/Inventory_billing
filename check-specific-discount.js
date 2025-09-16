const mongoose = require("mongoose")
const Discount = require("./server/models/Discount")
const Product = require("./server/models/Product")

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://deepan09112004:deepan@billing-software.9ovfewp.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const checkSpecificDiscount = async () => {
  try {
    console.log("🔍 Checking discount for specific product...")
    
    // Get the specific product
    const product = await Product.findById("68c69466a9ec07f2cb68dc89")
    console.log("\n📦 Product Details:")
    if (product) {
      console.log(`   ID: ${product._id}`)
      console.log(`   Name: ${product.name}`)
      console.log(`   Category: ${product.category}`)
      console.log(`   Price: ₹${product.price}`)
      console.log(`   Active: ${product.isActive}`)
    } else {
      console.log("❌ Product not found!")
      return
    }
    
    // Check all discounts
    const allDiscounts = await Discount.find({})
    console.log(`\n💰 Total discounts in database: ${allDiscounts.length}`)
    
    if (allDiscounts.length === 0) {
      console.log("❌ No discounts found in database!")
      return
    }
    
    console.log("\n📋 All Discounts:")
    allDiscounts.forEach((discount, index) => {
      console.log(`\n${index + 1}. ${discount.name}`)
      console.log(`   Type: ${discount.type}`)
      console.log(`   Value: ${discount.value}${discount.type === 'percentage' ? '%' : '₹'}`)
      console.log(`   Target Type: ${discount.targetType}`)
      console.log(`   Target Category: ${discount.targetCategory || 'N/A'}`)
      console.log(`   Target Product: ${discount.targetProduct || 'N/A'}`)
      console.log(`   Min Purchase: ₹${discount.minPurchaseAmount}`)
      console.log(`   Active: ${discount.isActive}`)
      console.log(`   Start Date: ${discount.startDate}`)
      console.log(`   End Date: ${discount.endDate}`)
      console.log(`   Used Count: ${discount.usedCount || 0}`)
      console.log(`   Usage Limit: ${discount.usageLimit || 'Unlimited'}`)
    })
    
    // Test the applicable discounts logic manually
    console.log("\n🎯 Testing applicable discounts logic...")
    const now = new Date()
    console.log(`   Current time: ${now}`)
    
    const applicableQuery = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { targetType: "all" },
        { targetType: "category", targetCategory: product.category },
        { targetType: "product", targetProduct: product._id },
      ],
      $expr: {
        $or: [
          { usageLimit: { $exists: false } },
          { $lt: ["$usedCount", "$usageLimit"] },
        ],
      },
    }
    
    console.log("\n📝 Query being executed:")
    console.log(JSON.stringify(applicableQuery, null, 2))
    
    const applicableDiscounts = await Discount.find(applicableQuery).populate("targetProduct")
    console.log(`\n✅ Found ${applicableDiscounts.length} applicable discounts`)
    
    if (applicableDiscounts.length > 0) {
      console.log("\n🏆 Applicable Discounts:")
      applicableDiscounts.forEach((discount, index) => {
        console.log(`\n${index + 1}. ${discount.name}`)
        console.log(`   Type: ${discount.type}`)
        console.log(`   Value: ${discount.value}${discount.type === 'percentage' ? '%' : '₹'}`)
        console.log(`   Target: ${discount.targetType}`)
        console.log(`   Active: ${discount.isActive}`)
        console.log(`   Start: ${discount.startDate}`)
        console.log(`   End: ${discount.endDate}`)
      })
    } else {
      console.log("❌ No applicable discounts found!")
      
      // Let's check why each discount is not applicable
      console.log("\n🔍 Analyzing why discounts are not applicable:")
      for (const discount of allDiscounts) {
        console.log(`\n📋 Checking discount: ${discount.name}`)
        
        // Check active status
        if (!discount.isActive) {
          console.log("   ❌ Not active")
          continue
        }
        
        // Check dates
        const startDate = new Date(discount.startDate)
        const endDate = new Date(discount.endDate)
        if (now < startDate) {
          console.log(`   ❌ Not started yet (starts: ${startDate})`)
          continue
        }
        if (now > endDate) {
          console.log(`   ❌ Expired (ended: ${endDate})`)
          continue
        }
        
        // Check target
        let targetMatch = false
        if (discount.targetType === "all") {
          targetMatch = true
          console.log("   ✅ Targets all products")
        } else if (discount.targetType === "category" && discount.targetCategory === product.category) {
          targetMatch = true
          console.log(`   ✅ Targets category: ${discount.targetCategory}`)
        } else if (discount.targetType === "product" && discount.targetProduct?.toString() === product._id.toString()) {
          targetMatch = true
          console.log("   ✅ Targets this specific product")
        } else {
          console.log(`   ❌ Target mismatch (type: ${discount.targetType}, category: ${discount.targetCategory}, product: ${discount.targetProduct})`)
        }
        
        // Check usage limit
        if (discount.usageLimit) {
          if (discount.usedCount >= discount.usageLimit) {
            console.log(`   ❌ Usage limit reached (${discount.usedCount}/${discount.usageLimit})`)
            continue
          } else {
            console.log(`   ✅ Usage limit OK (${discount.usedCount}/${discount.usageLimit})`)
          }
        } else {
          console.log("   ✅ No usage limit")
        }
        
        if (targetMatch) {
          console.log("   ✅ This discount should be applicable!")
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Error checking discount:", error)
    console.error("Error stack:", error.stack)
  } finally {
    mongoose.connection.close()
  }
}

// Run the check
checkSpecificDiscount()
