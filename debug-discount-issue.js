// Debug script to identify discount application issues
// This script will help us understand why discounts are not being applied in POS

const fs = require('fs');
const path = require('path');

console.log("🔍 Debugging Discount Application Issue");
console.log("=====================================\n");

// 1. Check if the POS billing component has the correct discount logic
const posBillingPath = path.join(__dirname, 'components', 'pos', 'pos-billing.tsx');
console.log("📄 Checking POS billing component...");

try {
  const posBillingContent = fs.readFileSync(posBillingPath, 'utf8');
  
  // Check for discount fetching logic
  const hasGetApplicableDiscounts = posBillingContent.includes('getApplicableDiscounts');
  const hasDiscountLogic = posBillingContent.includes('bestDiscount');
  const hasDiscountCalculation = posBillingContent.includes('discountAmount');
  
  console.log(`✅ Has getApplicableDiscounts call: ${hasGetApplicableDiscounts}`);
  console.log(`✅ Has discount logic: ${hasDiscountLogic}`);
  console.log(`✅ Has discount calculation: ${hasDiscountCalculation}`);
  
  if (!hasGetApplicableDiscounts) {
    console.log("❌ Missing getApplicableDiscounts call in POS billing");
  }
  if (!hasDiscountLogic) {
    console.log("❌ Missing discount logic in POS billing");
  }
  if (!hasDiscountCalculation) {
    console.log("❌ Missing discount calculation in POS billing");
  }
  
} catch (error) {
  console.log("❌ Error reading POS billing component:", error.message);
}

// 2. Check if the API client has the correct method
const apiPath = path.join(__dirname, 'lib', 'api.ts');
console.log("\n📄 Checking API client...");

try {
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  
  const hasGetApplicableDiscountsMethod = apiContent.includes('getApplicableDiscounts(productId: string)');
  const hasCorrectEndpoint = apiContent.includes('/discounts/applicable/');
  
  console.log(`✅ Has getApplicableDiscounts method: ${hasGetApplicableDiscountsMethod}`);
  console.log(`✅ Has correct endpoint: ${hasCorrectEndpoint}`);
  
  if (!hasGetApplicableDiscountsMethod) {
    console.log("❌ Missing getApplicableDiscounts method in API client");
  }
  if (!hasCorrectEndpoint) {
    console.log("❌ Missing correct endpoint in API client");
  }
  
} catch (error) {
  console.log("❌ Error reading API client:", error.message);
}

// 3. Check if the backend has the correct route
const discountRoutesPath = path.join(__dirname, 'server', 'routes', 'discounts.js');
console.log("\n📄 Checking backend discount routes...");

try {
  const discountRoutesContent = fs.readFileSync(discountRoutesPath, 'utf8');
  
  const hasApplicableRoute = discountRoutesContent.includes('/applicable/:productId');
  const hasAuthMiddleware = discountRoutesContent.includes('auth, async');
  const hasFindApplicableDiscounts = discountRoutesContent.includes('findApplicableDiscounts');
  
  console.log(`✅ Has /applicable/:productId route: ${hasApplicableRoute}`);
  console.log(`✅ Has auth middleware: ${hasAuthMiddleware}`);
  console.log(`✅ Has findApplicableDiscounts call: ${hasFindApplicableDiscounts}`);
  
  if (!hasApplicableRoute) {
    console.log("❌ Missing /applicable/:productId route in backend");
  }
  if (!hasAuthMiddleware) {
    console.log("❌ Missing auth middleware in backend route");
  }
  if (!hasFindApplicableDiscounts) {
    console.log("❌ Missing findApplicableDiscounts call in backend");
  }
  
} catch (error) {
  console.log("❌ Error reading backend discount routes:", error.message);
}

// 4. Check if the Discount model has the correct method
const discountModelPath = path.join(__dirname, 'server', 'models', 'Discount.js');
console.log("\n📄 Checking Discount model...");

try {
  const discountModelContent = fs.readFileSync(discountModelPath, 'utf8');
  
  const hasFindApplicableDiscountsMethod = discountModelContent.includes('findApplicableDiscounts');
  const hasStaticMethod = discountModelContent.includes('statics.findApplicableDiscounts');
  
  console.log(`✅ Has findApplicableDiscounts method: ${hasFindApplicableDiscountsMethod}`);
  console.log(`✅ Has static method definition: ${hasStaticMethod}`);
  
  if (!hasFindApplicableDiscountsMethod) {
    console.log("❌ Missing findApplicableDiscounts method in Discount model");
  }
  if (!hasStaticMethod) {
    console.log("❌ Missing static method definition in Discount model");
  }
  
} catch (error) {
  console.log("❌ Error reading Discount model:", error.message);
}

// 5. Check if the billing table displays discounts
const billingTablePath = path.join(__dirname, 'components', 'pos', 'billing-table.tsx');
console.log("\n📄 Checking billing table display...");

try {
  const billingTableContent = fs.readFileSync(billingTablePath, 'utf8');
  
  const hasDiscountColumn = billingTableContent.includes('Discount');
  const hasDiscountDisplay = billingTableContent.includes('item.discount');
  const hasDiscountBadge = billingTableContent.includes('discountType');
  
  console.log(`✅ Has discount column: ${hasDiscountColumn}`);
  console.log(`✅ Has discount display logic: ${hasDiscountDisplay}`);
  console.log(`✅ Has discount badge display: ${hasDiscountBadge}`);
  
  if (!hasDiscountColumn) {
    console.log("❌ Missing discount column in billing table");
  }
  if (!hasDiscountDisplay) {
    console.log("❌ Missing discount display logic in billing table");
  }
  if (!hasDiscountBadge) {
    console.log("❌ Missing discount badge display in billing table");
  }
  
} catch (error) {
  console.log("❌ Error reading billing table:", error.message);
}

console.log("\n✅ Debug script completed!");
console.log("📋 Next steps:");
console.log("1. Run the application and check the browser console for the logging messages");
console.log("2. Add a product to the cart and observe the console output");
console.log("3. Check if discounts are being fetched and applied correctly");
console.log("4. If issues persist, check the server logs for any errors");
