  "use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Header } from "@/components/layout/header"
import { Navigation } from "@/components/layout/navigation"
import { ProductList } from "@/components/products/product-list"
import { POSBilling } from "@/components/pos/pos-billing"
import { ShiftManagement } from "@/components/shifts/shift-management"
import { BillList } from "@/components/bills/bill-list"
import { ReportsDashboard } from "@/components/reports/reports-dashboard"
import { EmployeeList } from "@/components/employees/employee-list"
import { DiscountList } from "@/components/discounts/discount-list"
import { SettingsManagement } from "@/components/settings/settings-management"

// Placeholder components for different tabs
function BillingTab() {
  return (
    <div className="p-6">
      <POSBilling />
    </div>
  )
}

function ProductsTab() {
  return (
    <div className="p-6">
      <ProductList />
    </div>
  )
}

function BillsTab() {
  return (
    <div className="p-6">
      <BillList />
    </div>
  )
}

function ShiftsTab() {
  return (
    <div className="p-6">
      <ShiftManagement />
    </div>
  )
}


function ReportsTab() {
  return (
    <div className="p-6">
      <ReportsDashboard />
    </div>
  )
}

function DiscountsTab() {
  return (
    <div className="p-6">
      <DiscountList />
    </div>
  )
}

function UsersTab() {
  return (
    <div className="p-6">
      <EmployeeList />
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="p-6">
      <SettingsManagement />
    </div>
  )
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("billing")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const renderTabContent = () => {
    switch (activeTab) {
      case "billing":
        return <BillingTab />
      case "products":
        return <ProductsTab />
      case "bills":
        return <BillsTab />
      case "shifts":
        return <ShiftsTab />
      case "reports":
        return <ReportsTab />
      case "discounts":
        return <DiscountsTab />
      case "users":
        return <UsersTab />
      case "settings":
        return <SettingsTab />
      default:
        return <BillingTab />
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Navigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            isSidebarOpen={isSidebarOpen} 
            onSidebarToggle={setIsSidebarOpen} 
          />
          <main className="flex-1">{renderTabContent()}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
