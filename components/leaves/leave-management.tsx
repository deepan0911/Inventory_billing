"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LeaveList } from "./leave-list"
import { useAuth } from "@/hooks/use-auth"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface LeaveStats {
  totalLeaves: number
  pendingLeaves: number
  approvedLeaves: number
  rejectedLeaves: number
  cancelledLeaves: number
  totalDays: number
}

export function LeaveManagement() {
  const { user } = useAuth()
  const [stats, setStats] = useState<LeaveStats>({
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    cancelledLeaves: 0,
    totalDays: 0
  })
  const [loading, setLoading] = useState(false)

  const isAdmin = user?.role === "admin"

  const loadStats = async () => {
    try {
      setLoading(true)
      // In a real implementation, you would fetch actual stats from the API
      // For now, we'll use placeholder data
      setStats({
        totalLeaves: 12,
        pendingLeaves: 2,
        approvedLeaves: 8,
        rejectedLeaves: 1,
        cancelledLeaves: 1,
        totalDays: 24
      })
    } catch (error) {
      console.error("Failed to load leave stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, variant = "default" }: {
    title: string
    value: string | number
    icon: any
    variant?: "default" | "secondary" | "destructive" | "outline"
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? "Manage employee leave requests and approvals"
            : "Apply for leave and track your leave history"
          }
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Leaves"
          value={stats.totalLeaves}
          icon={Calendar}
        />
        <StatCard
          title="Pending"
          value={stats.pendingLeaves}
          icon={Clock}
          variant="default"
        />
        <StatCard
          title="Approved"
          value={stats.approvedLeaves}
          icon={CheckCircle}
          variant="secondary"
        />
        <StatCard
          title="Rejected"
          value={stats.rejectedLeaves}
          icon={XCircle}
          variant="destructive"
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelledLeaves}
          icon={AlertCircle}
          variant="outline"
        />
        <StatCard
          title="Total Days"
          value={stats.totalDays}
          icon={Calendar}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue={isAdmin ? "all-leaves" : "my-leaves"} className="space-y-4">
        <TabsList>
          {isAdmin && (
            <TabsTrigger value="all-leaves">All Leave Requests</TabsTrigger>
          )}
          <TabsTrigger value="my-leaves">My Leaves</TabsTrigger>
        </TabsList>

        {isAdmin && (
          <TabsContent value="all-leaves" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Employee Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <LeaveList adminView={true} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="my-leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaveList adminView={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
