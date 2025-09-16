"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package } from "lucide-react"
import { apiClient, type SalesSummaryResponse } from "@/lib/api"

interface SalesOverviewProps {
  startDate?: string
  endDate?: string
}

export function SalesOverview({ startDate, endDate }: SalesOverviewProps) {
  const [salesData, setSalesData] = useState<SalesSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadSalesData = async () => {
    try {
      setIsLoading(true)
      setError("")
      const data = await apiClient.getSalesSummary({ startDate, endDate })
      setSalesData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSalesData()
  }, [startDate, endDate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !salesData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {error || "No sales data available"}
        </CardContent>
      </Card>
    )
  }

  const { totals } = salesData

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalSales)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-sm text-green-600">Revenue</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bills</p>
              <p className="text-2xl font-bold">{totals.totalBills}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <Badge variant="outline" className="text-xs">
              Avg: {formatCurrency(totals.avgBillValue)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Items Sold</p>
              <p className="text-2xl font-bold">{totals.totalItems}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-sm text-muted-foreground">
              {totals.totalBills > 0 ? (totals.totalItems / totals.totalBills).toFixed(1) : 0} per bill
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Discount</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalDiscount)}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <TrendingDown className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-sm text-muted-foreground">
              {totals.totalSales > 0 ? ((totals.totalDiscount / totals.totalSales) * 100).toFixed(1) : 0}% of sales
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
