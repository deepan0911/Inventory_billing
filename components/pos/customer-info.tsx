"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, User } from "lucide-react"

interface CustomerInfo {
  name?: string
  phone?: string
  address?: string
  gstNumber?: string
}

interface CustomerInfoProps {
  customerInfo: CustomerInfo
  onCustomerInfoChange: (info: CustomerInfo) => void
}

export function CustomerInfo({ customerInfo, onCustomerInfoChange }: CustomerInfoProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    onCustomerInfoChange({
      ...customerInfo,
      [field]: value,
    })
  }

  const clearCustomerInfo = () => {
    onCustomerInfoChange({})
  }

  return (
    <Card className="w-100">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
                {(customerInfo.name || customerInfo.phone) && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({customerInfo.name || customerInfo.phone})
                  </span>
                )}
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4"><br></br>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerInfo.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  value={customerInfo.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress">Address</Label>
              <Input
                id="customerAddress"
                value={customerInfo.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter customer address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={customerInfo.gstNumber || ""}
                onChange={(e) => handleInputChange("gstNumber", e.target.value.toUpperCase())}
                placeholder="Enter GST number"
              />
            </div>

            <Button variant="outline" onClick={clearCustomerInfo} className="w-full bg-transparent">
              Clear Customer Info
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
