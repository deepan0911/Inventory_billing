"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, AlertTriangle, TrendingDown, Warehouse } from "lucide-react"
import { apiClient, type InventoryReport } from "@/lib/api"

export function InventorySummary() {
  const [inventoryData, setInventoryData] = useState<InventoryReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [showLowStock, setShowLowStock] = useState(false)

  const loadInventoryData = async (lowStock = false) => {
    try {
      setIsLoading(true)
      setError("")
      const data = await apiClient.getInventoryReport({ lowStock })
      setInventoryData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInventoryData(showLowStock)
  }, [showLowStock])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", variant: "destructive" as const, icon: AlertTriangle }
    if (stock < 10) return { label: "Low Stock", variant: "secondary" as const, icon: TrendingDown }
    return { label: "In Stock", variant: "default" as const, icon: Package }
  }

  return (
    <div className="space-y-6">
      {/* Inventory Overview Cards */}
      {inventoryData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{inventoryData.summary.totalProducts}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inventory Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(inventoryData.summary.inventoryValue)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Warehouse className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-600">{inventoryData.summary.lowStockCount}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <TrendingDown className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{inventoryData.summary.outOfStockCount}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Status
              </CardTitle>
              <CardDescription>
                {showLowStock ? "Products with low stock levels" : "All active products"}
              </CardDescription>
            </div>
            <Button variant={showLowStock ? "default" : "outline"} onClick={() => setShowLowStock(!showLowStock)}>
              {showLowStock ? "Show All" : "Show Low Stock"}
            </Button>
          </div>
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
          ) : !inventoryData || inventoryData.products.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No products found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Cost Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.products.slice(0, 20).map((product) => {
                  const status = getStockStatus(product.stock)
                  const StatusIcon = status.icon
                  return (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">Code: {product.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          {product.stock} {product.unit}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(product.stock * product.cost)}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
