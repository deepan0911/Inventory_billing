const mongoose = require("mongoose")
const Discount = require("./server/models/Discount")
const Product = require("./server/models/Product")

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://deepan09112004:deepan@billing-software.9ovfewp.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const testDiscountFlow = async () => {
  try {
    console.log("🧪 Testing Discount Flow...")
    
    // 1. Check if there are any products
    const products = await Product.find({}).limit(5)
    console.log(`\n📦 Found ${products.length} products`)
    
    if (products.length === 0) {
      console.log("❌ No products found in database!")
      return
    }
    
    const testProduct = products[0]
    console.log(`\n📋 Using test product: ${testProduct.name} (${testProduct.category})`)
    
    // 2. Check existing discounts
    const existingDiscounts = await Discount.find({})
    console.log(`\n💰 Found ${existingDiscounts.length} existing discounts`)
    
    // 3. Create a test discount for all products
    const testDiscount = new Discount({
      name: "Test All Products Discount",
      description: "Test discount for all products",
      type: "percentage",
      value: 10,
      targetType: "all",
      minPurchaseAmount: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
      createdBy: "64f1a2b3c4d5e6f7g8h9i0j1" // Dummy user ID
    })
    
    await testDiscount.save()
    console.log(`\n✅ Created test discount: ${testDiscount.name}`)
    
    // 4. Test finding applicable discounts for the product
    const applicableDiscounts = await Discount.findApplicableDiscounts(testProduct)
    console.log(`\n🎯 Found ${applicableDiscounts.length} applicable discounts for ${testProduct.name}`)
    
    if (applicableDiscounts.length > 0) {
      console.log("\n📝 Applicable Discounts:")
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
    }
    
    // 5. Test finding best discount
    const bestDiscount = await Discount.findBestDiscount(testProduct)
    console.log(`\n🏆 Best discount for ${testProduct.name}:`)
    if (bestDiscount) {
      console.log(`   Name: ${bestDiscount.name}`)
      console.log(`   Type: ${bestDiscount.type}`)
      console.log(`   Value: ${bestDiscount.value}${bestDiscount.type === 'percentage' ? '%' : '₹'}`)
    } else {
      console.log("   No best discount found")
    }
    
    // 6. Clean up test discount
    await Discount.findByIdAndDelete(testDiscount._id)
    console.log(`\n🧹 Cleaned up test discount`)
    
    console.log("\n✅ Discount flow test completed!")
    
  } catch (error) {
    console.error("❌ Error testing discount flow:", error)
    console.error("Error stack:", error.stack)
  } finally {
    mongoose.connection.close()
  }
}

// Run the test
testDiscountFlow()
