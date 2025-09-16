"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, TrendingUp } from "lucide-react"
import { apiClient, type TopProduct } from "@/lib/api"

interface TopProductsProps {
  startDate?: string
  endDate?: string
  limit?: number
}

export function TopProducts({ startDate, endDate, limit = 10 }: TopProductsProps) {
  const [products, setProducts] = useState<TopProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadTopProducts = async () => {
    try {
      setIsLoading(true)
      setError("")
      const data = await apiClient.getTopProducts({ startDate, endDate, limit })
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load top products")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTopProducts()
  }, [startDate, endDate, limit])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Top Selling Products
        </CardTitle>
        <CardDescription>Best performing products by revenue</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-muted-foreground py-8">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No products data available</div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={product._id.productId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={index < 3 ? "default" : "outline"}
                          className="w-8 h-8 rounded-full p-0 flex items-center justify-center"
                        >
                          {index + 1}
                        </Badge>
                        {index === 0 && <TrendingUp className="h-4 w-4 text-green-600" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product._id.productName}</div>
                        <div className="text-sm text-muted-foreground">Code: {product._id.productCode}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{product.totalQuantity}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(product.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">{product.totalOrders}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
