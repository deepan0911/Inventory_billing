const mongoose = require("mongoose")
const Discount = require("./models/Discount")

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://deepan09112004:deepan@billing-software.9ovfewp.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const checkDiscounts = async () => {
  try {
    console.log("🔍 Checking discounts in database...")
    
    // Get all discounts
    const allDiscounts = await Discount.find({})
    console.log(`\n📊 Total discounts in database: ${allDiscounts.length}`)
    
    if (allDiscounts.length === 0) {
      console.log("❌ No discounts found in database!")
      return
    }
    
    console.log("\n📋 All discounts:")
    allDiscounts.forEach((discount, index) => {
      console.log(`\n${index + 1}. ${discount.name}`)
      console.log(`   Type: ${discount.type}`)
      console.log(`   Value: ${discount.value}${discount.type === 'percentage' ? '%' : '₹'}`)
      console.log(`   Applicable To: ${discount.applicableTo}`)
      console.log(`   Category: ${discount.category || 'N/A'}`)
      console.log(`   Products: ${discount.products ? discount.products.length : 0} products`)
      console.log(`   Min Purchase: ₹${discount.minPurchaseAmount}`)
      console.log(`   Active: ${discount.isActive}`)
      console.log(`   Start Date: ${discount.startDate}`)
      console.log(`   End Date: ${discount.endDate}`)
      console.log(`   Created By: ${discount.createdBy}`)
    })
    
    // Check for test discounts specifically
    const testDiscounts = await Discount.find({ 
      name: { $in: ["Test General Discount", "Test Groceries Discount", "Test Coconut Oil Discount"] } 
    })
    console.log(`\n🧪 Test discounts found: ${testDiscounts.length}`)
    
    if (testDiscounts.length > 0) {
      console.log("✅ Test discounts are present in database")
    } else {
      console.log("❌ Test discounts not found in database")
    }
    
    // Check for active discounts
    const activeDiscounts = await Discount.find({ isActive: true })
    console.log(`\n✅ Active discounts: ${activeDiscounts.length}`)
    
    // Check discounts applicable to Groceries category
    const groceriesDiscounts = await Discount.find({ 
      applicableTo: "category", 
      category: "Groceries",
      isActive: true 
    })
    console.log(`🛒 Discounts for Groceries category: ${groceriesDiscounts.length}`)
    
    // Check discounts applicable to specific product
    const productDiscounts = await Discount.find({ 
      applicableTo: "specific",
      products: "68c5f57b35d2dc609807aec0",
      isActive: true 
    })
    console.log(`🥥 Discounts for Coconut Oil product: ${productDiscounts.length}`)
    
  } catch (error) {
    console.error("❌ Error checking discounts:", error)
  } finally {
    await mongoose.disconnect()
    console.log("\n🔌 Disconnected from MongoDB")
  }
}

// Run the script
checkDiscounts()
