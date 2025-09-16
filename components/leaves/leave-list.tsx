"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Eye, Check, X, Download } from "lucide-react"
import { format } from "date-fns"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { LeaveForm } from "./leave-form"

interface Leave {
  _id: string
  employee: any
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  approvedBy?: any
  approvedAt?: string
  rejectedReason?: string
  documents: Array<{
    filename: string
    path: string
    uploadedAt: string
  }>
  isHalfDay: boolean
  halfDayType?: string
  emergencyContact?: {
    name: string
    phone: string
    relation: string
  }
  createdAt: string
}

interface LeaveListProps {
  adminView?: boolean
}

export function LeaveList({ adminView = false }: LeaveListProps) {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [showForm, setShowForm] = useState(false)

  const loadLeaves = async () => {
    try {
      setLoading(true)
      setError("")
      
      const endpoint = adminView ? "/leaves" : "/leaves/my-leaves"
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)
      
      const query = params.toString()
      const response = await (adminView ? apiClient.getLeaves({ status: statusFilter === "all" ? undefined : statusFilter }) : apiClient.getMyLeaves())
      
      setLeaves(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leave requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaves()
  }, [adminView, statusFilter])

  const handleApprove = async (leaveId: string) => {
    try {
      await apiClient.approveLeave(leaveId)
      await loadLeaves()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve leave")
    }
  }

  const handleReject = async () => {
    if (!selectedLeave || !rejectReason.trim()) return
    
    try {
      await apiClient.rejectLeave(selectedLeave._id, rejectReason)
      setShowRejectDialog(false)
      setRejectReason("")
      setSelectedLeave(null)
      await loadLeaves()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject leave")
    }
  }

  const handleCancel = async (leaveId: string) => {
    try {
      await apiClient.cancelLeave(leaveId)
      await loadLeaves()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel leave")
    }
  }

  const filteredLeaves = leaves.filter(leave => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        leave.employeeName.toLowerCase().includes(searchLower) ||
        leave.leaveType.toLowerCase().includes(searchLower) ||
        leave.reason.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "default",
      approved: "secondary",
      rejected: "destructive",
      cancelled: "outline"
    }
    
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP")
  }

  const downloadDocument = async (doc: any, leaveId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/leaves/documents/${leaveId}/${doc.filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error("Failed to download document:", err)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {adminView ? "All Leave Requests" : "My Leave Requests"}
          </h2>
          <p className="text-muted-foreground">
            {adminView ? "Manage employee leave requests" : "View and manage your leave requests"}
          </p>
        </div>
        
        {!adminView && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button>Apply for Leave</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
              </DialogHeader>
              <LeaveForm 
                onSuccess={() => {
                  setShowForm(false)
                  loadLeaves()
                }}
                onCancel={() => setShowForm(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search leaves..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading leave requests...</span>
          </CardContent>
        </Card>
      )}

      {/* Leave List */}
      {!loading && filteredLeaves.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No leave requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLeaves.map((leave) => (
            <Card key={leave._id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{leave.employeeName}</h3>
                      {getStatusBadge(leave.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="ml-2 font-medium capitalize">{leave.leaveType}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="ml-2 font-medium">
                          {leave.totalDays} {leave.totalDays === 1 ? "day" : "days"}
                          {leave.isHalfDay && ` (${leave.halfDayType})`}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Start:</span>
                        <span className="ml-2 font-medium">{formatDate(leave.startDate)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">End:</span>
                        <span className="ml-2 font-medium">{formatDate(leave.endDate)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Reason:</span>
                      <p className="mt-1 text-sm">{leave.reason}</p>
                    </div>

                    {leave.rejectedReason && (
                      <div>
                        <span className="text-muted-foreground">Rejection Reason:</span>
                        <p className="mt-1 text-sm text-red-600">{leave.rejectedReason}</p>
                      </div>
                    )}

                    {leave.documents.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Documents:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {leave.documents.map((doc, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => downloadDocument(doc, leave._id)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              {doc.filename}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Leave Request Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Employee</Label>
                              <p className="font-medium">{leave.employeeName}</p>
                            </div>
                            <div>
                              <Label>Status</Label>
                              {getStatusBadge(leave.status)}
                            </div>
                            <div>
                              <Label>Leave Type</Label>
                              <p className="font-medium capitalize">{leave.leaveType}</p>
                            </div>
                            <div>
                              <Label>Total Days</Label>
                              <p className="font-medium">{leave.totalDays} days</p>
                            </div>
                            <div>
                              <Label>Start Date</Label>
                              <p className="font-medium">{formatDate(leave.startDate)}</p>
                            </div>
                            <div>
                              <Label>End Date</Label>
                              <p className="font-medium">{formatDate(leave.endDate)}</p>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Reason</Label>
                            <p className="mt-1">{leave.reason}</p>
                          </div>

                          {leave.emergencyContact && (
                            <div>
                              <Label>Emergency Contact</Label>
                              <p className="mt-1">
                                {leave.emergencyContact.name} - {leave.emergencyContact.phone}
                                {leave.emergencyContact.relation && ` (${leave.emergencyContact.relation})`}
                              </p>
                            </div>
                          )}

                          {leave.approvedBy && leave.approvedAt && (
                            <div>
                              <Label>Approved By</Label>
                              <p className="mt-1">{leave.approvedBy.name} on {formatDate(leave.approvedAt)}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {adminView && leave.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(leave._id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedLeave(leave)
                            setShowRejectDialog(true)
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {!adminView && leave.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(leave._id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectReason">Rejection Reason *</Label>
              <Textarea
                id="rejectReason"
                placeholder="Please provide a reason for rejecting this leave request..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
