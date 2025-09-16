"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShoppingCart, RefreshCw, FileText } from "lucide-react"
import { ProductSearch } from "./product-search"
import { BillingTable, type BillItem } from "./billing-table"
import { BillingSummary } from "./billing-summary"
import { PaymentSection } from "./payment-section"
import { CustomerInfo } from "./customer-info"
import { apiClient, type Product, type ProductVariant } from "@/lib/api"

export function POSBilling() {
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [customerInfo, setCustomerInfo] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const calculateItemTotals = useCallback((item: Omit<BillItem, "amount" | "taxAmount" | "totalAmount">) => {
    const baseAmount = item.quantity * item.rate
    let discountAmount = 0
    
    if (item.discount) {
      if (item.discount.discountType === 'percentage') {
        discountAmount = baseAmount * (item.discount.discountValue / 100)
      } else {
        // Fixed amount discount
        discountAmount = Math.min(item.discount.discountValue * item.quantity, baseAmount)
      }
    }
    
    const discountedAmount = baseAmount - discountAmount
    const taxAmount = discountedAmount * (item.product.taxRate / 100)
    const totalAmount = discountedAmount + taxAmount

    return {
      ...item,
      amount: discountedAmount,
      taxAmount,
      totalAmount,
      discount: item.discount ? {
        ...item.discount,
        discountAmount
      } : undefined
    }
  }, [])

  const addProduct = async (product: Product, variant: ProductVariant) => {
    // Fetch applicable discounts for this product
    let bestDiscount = null
    try {
      console.log("🔍 Fetching discounts for product:", product._id, product.name, "variant:", variant.size)
      const discounts = await apiClient.getApplicableDiscounts(product._id)
      console.log("📦 Found discounts:", discounts)
      
      if (discounts && discounts.length > 0) {
        // Sort discounts by discount amount (highest first)
        const sortedDiscounts = discounts.sort((a, b) => {
          const discountA = a.type === 'percentage' ? (variant.price * a.value / 100) : Math.min(a.value, variant.price)
          const discountB = b.type === 'percentage' ? (variant.price * b.value / 100) : Math.min(b.value, variant.price)
          return discountB - discountA
        })
        
        bestDiscount = sortedDiscounts[0]
        console.log("🏆 Best discount selected:", bestDiscount)
      } else {
        console.log("❌ No applicable discounts found for product:", product.name)
      }
    } catch (error) {
      console.error("❌ Error fetching discounts:", error)
      // Continue without discount if there's an error
    }

    const existingItemIndex = billItems.findIndex((item) => item.product._id === product._id && item.variant.size === variant.size)

    if (existingItemIndex >= 0) {
      // Update existing item quantity - preserve existing discount
      const existingItem = billItems[existingItemIndex]
      const updatedItem = calculateItemTotals({
        ...existingItem,
        quantity: existingItem.quantity + 1,
        // Keep the existing discount, don't fetch new one
        discount: existingItem.discount
      })

      setBillItems((prev) => prev.map((item, index) => (index === existingItemIndex ? updatedItem : item)))
    } else {
      // Add new item with discount if applicable
      const newItem = calculateItemTotals({
        id: `${product._id}-${variant.sku || variant.size}-${Date.now()}`,
        product,
        variant,
        quantity: 1,
        rate: variant.price,
        discount: bestDiscount ? {
          discountId: bestDiscount._id,
          discountName: bestDiscount.name,
          discountType: bestDiscount.type,
          discountValue: bestDiscount.value,
          discountAmount: 0 // This will be calculated in calculateItemTotals
        } : undefined
      })

      setBillItems((prev) => [...prev, newItem])
    }
  }

  const updateItem = (id: string, updates: Partial<BillItem>) => {
    setBillItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updates }
          return calculateItemTotals(updatedItem)
        }
        return item
      }),
    )
  }

  const removeItem = (id: string) => {
    setBillItems((prev) => prev.filter((item) => item.id !== id))
  }

  const clearBill = () => {
    setBillItems([])
    setCustomerInfo({})
    setError("")
    setSuccess("")
  }

  const grandTotal = billItems.reduce((total, item) => total + item.totalAmount, 0)

  const handlePayment = async (paymentData: { cashTendered: number; paymentMethod: string }) => {
    if (billItems.length === 0) {
      setError("No items in the bill")
      return
    }

    setIsProcessing(true)
    setError("")

    try {
      const billData = {
        items: billItems.map((item) => ({
          product: item.product._id,
          variant: item.variant.sku,
          quantity: item.quantity,
          rate: item.rate,
          taxRate: item.product.taxRate,
        })),
        customer: customerInfo,
        cashTendered: paymentData.cashTendered,
        paymentMethod: paymentData.paymentMethod as any,
      }

      const bill = await apiClient.createBill(billData)
      setSuccess(`Bill ${bill.billNumber} created successfully!`)
      clearBill()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bill")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            POS Billing System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <ProductSearch onProductSelect={addProduct} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearBill} disabled={billItems.length === 0}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear All
              </Button>
              <Button variant="outline" disabled={billItems.length === 0}>
                <FileText className="mr-2 h-4 w-4" />
                Hold Bill
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Billing Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
        {/* Left Column - Customer Info and Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Information */}
          <CustomerInfo customerInfo={customerInfo} onCustomerInfoChange={setCustomerInfo} />
          
          {/* Billing Summary */}
          <BillingSummary items={billItems} />
          
          {/* Payment Section */}
          {billItems.length > 0 && (
            <PaymentSection grandTotal={Math.round(grandTotal)} onPayment={handlePayment} isProcessing={isProcessing} />
          )}
        </div>

        {/* Right Column - Billing Table (Scrollable) */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle>Items ({billItems.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <BillingTable items={billItems} onUpdateItem={updateItem} onRemoveItem={removeItem} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
