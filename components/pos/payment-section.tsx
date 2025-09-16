"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Banknote, Smartphone, Loader2 } from "lucide-react"

interface PaymentSectionProps {
  grandTotal: number
  onPayment: (paymentData: {
    cashTendered: number
    paymentMethod: "cash" | "card" | "upi" | "mixed"
  }) => Promise<void>
  isProcessing: boolean
}

export function PaymentSection({ grandTotal, onPayment, isProcessing }: PaymentSectionProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi" | "mixed">("cash")
  const [cashTendered, setCashTendered] = useState("")
  const [error, setError] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const cashAmount = Number.parseFloat(cashTendered) || 0
  const changeDue = Math.max(0, cashAmount - grandTotal)

  const handlePayment = async () => {
    setError("")

    if (paymentMethod === "cash" && cashAmount < grandTotal) {
      setError("Cash tendered is less than the total amount")
      return
    }

    try {
      await onPayment({
        cashTendered: paymentMethod === "cash" ? cashAmount : grandTotal,
        paymentMethod,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed")
    }
  }

  const quickCashAmounts = [
    grandTotal,
    Math.ceil(grandTotal / 100) * 100,
    Math.ceil(grandTotal / 500) * 500,
    Math.ceil(grandTotal / 1000) * 1000,
  ].filter((amount, index, arr) => arr.indexOf(amount) === index && amount >= grandTotal)

  return (
    <Card className="w-100">
      <CardHeader>
        <CardTitle className="text-lg">Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Cash
                </div>
              </SelectItem>
              <SelectItem value="card">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Card
                </div>
              </SelectItem>
              <SelectItem value="upi">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  UPI
                </div>
              </SelectItem>
              <SelectItem value="mixed">Mixed Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between text-lg font-bold">
          <span>Total Amount:</span>
          <span className="text-primary">{formatCurrency(grandTotal)}</span>
        </div>

        {paymentMethod === "cash" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="cashTendered">Cash Tendered</Label>
              <Input
                id="cashTendered"
                type="number"
                step="0.01"
                min="0"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                placeholder="0.00"
                className="text-lg"
              />
            </div>

            {/* Quick Cash Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {quickCashAmounts.slice(0, 4).map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setCashTendered(amount.toString())}
                  className="text-xs"
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>

            {cashAmount > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Cash Tendered:</span>
                    <span className="font-medium">{formatCurrency(cashAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change Due:</span>
                    <span className="font-medium text-green-600">{formatCurrency(changeDue)}</span>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {error && <div className="text-sm text-destructive">{error}</div>}

        <Button
          onClick={handlePayment}
          disabled={isProcessing || (paymentMethod === "cash" && cashAmount < grandTotal)}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Complete Sale - ${formatCurrency(grandTotal)}`
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
