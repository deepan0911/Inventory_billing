"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, Tag, Target, Users, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import type { Discount } from "@/lib/api"

interface DiscountDetailsProps {
  discount: Discount
}

export function DiscountDetails({ discount }: DiscountDetailsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getTargetTypeDisplay = (targetType: string, targetCategory?: string, targetProduct?: any) => {
    switch (targetType) {
      case "all":
        return "All Products"
      case "category":
        return `Category: ${targetCategory}`
      case "product":
        return `Product: ${targetProduct?.name || "Unknown"} (${targetProduct?.code || "N/A"})`
      default:
        return targetType
    }
  }

  const getDiscountTypeDisplay = (type: string, value: number) => {
    return type === "percentage" ? `${value}% off` : `${formatCurrency(value)} off`
  }

  const isDiscountActive = (discount: Discount) => {
    const now = new Date()
    const startDate = new Date(discount.startDate)
    const endDate = new Date(discount.endDate)
    return discount.isActive && now >= startDate && now <= endDate
  }

  const getUsageStatus = (discount: Discount) => {
    if (!discount.usageLimit) {
      return { status: "unlimited", color: "default", text: "Unlimited usage" }
    }
    
    const percentage = (discount.usedCount / discount.usageLimit) * 100
    
    if (percentage >= 100) {
      return { status: "exhausted", color: "destructive", text: "Usage limit reached" }
    } else if (percentage >= 80) {
      return { status: "warning", color: "secondary", text: `${Math.round(percentage)}% used` }
    } else {
      return { status: "available", color: "default", text: `${discount.usedCount} / ${discount.usageLimit} used` }
    }
  }

  const getStatusDisplay = (discount: Discount) => {
    const active = isDiscountActive(discount)
    const now = new Date()
    const startDate = new Date(discount.startDate)
    const endDate = new Date(discount.endDate)
    
    if (!discount.isActive) {
      return {
        icon: XCircle,
        text: "Inactive",
        color: "secondary",
        description: "Discount has been manually deactivated"
      }
    } else if (now < startDate) {
      return {
        icon: Clock,
        text: "Scheduled",
        color: "secondary",
        description: `Discount will start on ${formatDate(discount.startDate)}`
      }
    } else if (now > endDate) {
      return {
        icon: XCircle,
        text: "Expired",
        color: "destructive",
        description: `Discount expired on ${formatDate(discount.endDate)}`
      }
    } else {
      return {
        icon: CheckCircle,
        text: "Active",
        color: "default",
        description: `Discount is valid until ${formatDate(discount.endDate)}`
      }
    }
  }

  const status = getStatusDisplay(discount)
  const usageStatus = getUsageStatus(discount)
  const StatusIcon = status.icon

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 max-h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Header Section */}
      <div className="mb-6 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{discount.name}</h1>
          <Badge 
            variant={status.color as any} 
            className="text-sm px-3 py-1 font-semibold shadow-md"
          >
            <StatusIcon className="h-4 w-4 mr-1" />
            {status.text}
          </Badge>
        </div>
        <p className="text-base text-gray-600 dark:text-gray-300 mb-3">{discount.description}</p>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{status.description}</p>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Discount Information Card */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Discount Information</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Type</span>
              <Badge variant="outline" className="text-xs px-2 py-1 font-medium">
                {getDiscountTypeDisplay(discount.type, discount.value)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Value</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {discount.type === "percentage" 
                  ? `${discount.value}%` 
                  : formatCurrency(discount.value)
                }
              </span>
            </div>

            {discount.minPurchaseAmount > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Min Purchase</span>
                <span className="text-base font-medium text-gray-900 dark:text-white">{formatCurrency(discount.minPurchaseAmount)}</span>
              </div>
            )}

            {discount.maxDiscountAmount && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Max Discount</span>
                <span className="text-base font-medium text-gray-900 dark:text-white">{formatCurrency(discount.maxDiscountAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Target Information Card */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
              <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Target Information</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Target Type</span>
              <Badge variant="outline" className="text-xs px-2 py-1 font-medium">
                {discount.targetType}
              </Badge>
            </div>
            
            <div className="py-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">Applies To</span>
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-300 dark:border-gray-600">
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                  {getTargetTypeDisplay(discount.targetType, discount.targetCategory, discount.targetProduct)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Duration and Usage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Duration Card */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Duration</h2>
          </div>
          
          <div className="space-y-3">
            <div className="py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">Start Date</span>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {formatDate(discount.startDate)}
              </p>
            </div>
            
            <div className="py-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">End Date</span>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {formatDate(discount.endDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Usage Statistics Card */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Usage Statistics</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Times Used</span>
              <Badge variant={usageStatus.color as any} className="text-xs px-2 py-1 font-medium">
                {usageStatus.text}
              </Badge>
            </div>

            {discount.usageLimit && (
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Usage Progress</span>
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {Math.round((discount.usedCount / discount.usageLimit) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                    style={{ 
                      width: `${Math.min(100, (discount.usedCount / discount.usageLimit) * 100)}%` 
                    }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {discount.usedCount} of {discount.usageLimit} uses
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-md mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Additional Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">Created By</span>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {discount.createdBy?.name || "Unknown"}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">Created Date</span>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {formatDate(discount.createdAt)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">Last Updated</span>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {formatDate(discount.updatedAt)}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">Discount ID</span>
            <p className="text-xs font-mono font-medium text-gray-600 dark:text-gray-400 break-all leading-relaxed">
              {discount._id}
            </p>
          </div>
        </div>
      </div>

      {/* Conditions Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-teal-100 dark:bg-teal-900 rounded-lg">
            <CheckCircle className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Conditions Summary</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Summary of conditions that must be met for this discount to apply
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-xl border border-green-300 dark:border-green-700 shadow-sm">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-green-800 dark:text-green-200 leading-relaxed font-medium">
              Discount type: {getDiscountTypeDisplay(discount.type, discount.value)}
            </span>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-xl border border-green-300 dark:border-green-700 shadow-sm">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-green-800 dark:text-green-200 leading-relaxed font-medium">
              Applies to: {getTargetTypeDisplay(discount.targetType, discount.targetCategory, discount.targetProduct)}
            </span>
          </div>

          {discount.minPurchaseAmount > 0 && (
            <div className="flex items-start gap-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-xl border border-green-300 dark:border-green-700 shadow-sm">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-green-800 dark:text-green-200 leading-relaxed font-medium">
                Minimum purchase amount: {formatCurrency(discount.minPurchaseAmount)}
              </span>
            </div>
          )}

          {discount.maxDiscountAmount && (
            <div className="flex items-start gap-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-xl border border-green-300 dark:border-green-700 shadow-sm">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-green-800 dark:text-green-200 leading-relaxed font-medium">
                Maximum discount amount: {formatCurrency(discount.maxDiscountAmount)}
              </span>
            </div>
          )}

          {discount.usageLimit && (
            <div className={`flex items-start gap-3 p-3 rounded-xl border shadow-sm ${usageStatus.status === "exhausted" ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700" : "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700"}`}>
              {usageStatus.status === "exhausted" ? (
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              )}
              <span className={`text-sm leading-relaxed font-medium ${usageStatus.status === "exhausted" ? "text-red-800 dark:text-red-200" : "text-green-800 dark:text-green-200"}`}>
                Usage limit: {discount.usedCount} / {discount.usageLimit}
              </span>
            </div>
          )}

          <div className={`flex items-start gap-3 p-3 rounded-xl border shadow-sm ${status.text === "Active" ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700" : "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700"}`}>
            {status.text === "Active" ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            )}
            <span className={`text-sm leading-relaxed font-medium ${status.text === "Active" ? "text-green-800 dark:text-green-200" : "text-yellow-800 dark:text-yellow-200"}`}>
              Valid from {formatDate(discount.startDate)} to {formatDate(discount.endDate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
