"use client"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShiftStatus } from "./shift-status"
import { ShiftHistory } from "./shift-history"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Users, TrendingUp, AlertTriangle, Clock, UserPlus } from "lucide-react"

export function ShiftManagement() {
  const { user } = useAuth()
  const [shiftSummary, setShiftSummary] = useState<any>(null)
  const [activeShifts, setActiveShifts] = useState<any[]>([])
  const [availableCashiers, setAvailableCashiers] = useState<any>(null)
  const [allEmployees, setAllEmployees] = useState<any[]>([])
  const [selectedAbsentCashier, setSelectedAbsentCashier] = useState<string>("")
  const [selectedTemporaryCashier, setSelectedTemporaryCashier] = useState<string>("")
  const [assignmentReason, setAssignmentReason] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isAdmin = user?.role === "admin"

  const loadAdminData = async () => {
    if (!isAdmin) return

    try {
      setLoading(true)
      setError("")
      
      const [summary, activeShiftsData, cashiersData] = await Promise.all([
        apiClient.getShiftSummary(),
        apiClient.getActiveShifts(),
        apiClient.getAvailableCashiers()
      ])
      
      // Fetch all employees for temporary assignment
      const employeesResponse = await fetch('http://localhost:5001/api/employees', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json()
        setAllEmployees(employeesData.filter((emp: any) => emp.user.role === 'cashier' && emp.user.isActive))
      }
      
      setShiftSummary(summary)
      setActiveShifts(activeShiftsData)
      setAvailableCashiers(cashiersData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadAdminData()
    }
  }, [isAdmin])

  const handleForceEndShift = async (shiftId: string) => {
    try {
      await apiClient.forceEndShift(shiftId)
      await loadAdminData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end shift")
    }
  }

  const handleTemporaryAssignment = async () => {
    if (!selectedAbsentCashier || !selectedTemporaryCashier || !assignmentReason) {
      setError("Please fill in all fields")
      return
    }

    if (selectedAbsentCashier === selectedTemporaryCashier) {
      setError("Absent cashier and temporary cashier cannot be the same")
      return
    }

    try {
      setIsAssigning(true)
      setError("")
      
      const response = await fetch('http://localhost:5001/api/shifts/assign-temporary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          absentCashierId: selectedAbsentCashier,
          temporaryCashierId: selectedTemporaryCashier,
          reason: assignmentReason
        })
      })

      if (response.ok) {
        // Reset form
        setSelectedAbsentCashier("")
        setSelectedTemporaryCashier("")
        setAssignmentReason("")
        
        // Show success message
        alert("Temporary cashier assigned successfully!")
        
        // Reload data
        await loadAdminData()
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to assign temporary cashier")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign temporary cashier")
    } finally {
      setIsAssigning(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="status" className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-5" : "grid-cols-2"}`}>
          <TabsTrigger value="status">Current Shift</TabsTrigger>
          <TabsTrigger value="history">Shift History</TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="active">Active Shifts</TabsTrigger>
              <TabsTrigger value="temporary">Temporary Assignment</TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="status" className="space-y-6">
          <ShiftStatus />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <ShiftHistory />
        </TabsContent>
        
        {isAdmin && (
          <>
            <TabsContent value="overview" className="space-y-6">
              {loading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading overview...</span>
                  </CardContent>
                </Card>
              ) : shiftSummary ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="flex items-center p-6">
                        <Clock className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Shifts</p>
                          <p className="text-2xl font-bold">{shiftSummary.totalShifts}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="flex items-center p-6">
                        <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Sales</p>
                          <p className="text-2xl font-bold">{formatCurrency(shiftSummary.totalSales)}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="flex items-center p-6">
                        <Users className="h-8 w-8 text-purple-600 mr-3" />
                        <div>
                          <p className="text-sm text-muted-foreground">Active Shifts</p>
                          <p className="text-2xl font-bold">{shiftSummary.activeShifts}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="flex items-center p-6">
                        <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Sales/Shift</p>
                          <p className="text-2xl font-bold">{formatCurrency(shiftSummary.averageSalesPerShift)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Shifts by Cashier */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Shift Performance by Cashier</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(shiftSummary.shiftsByCashier).map(([cashierName, data]: [string, any]) => (
                          <div key={cashierName} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">{cashierName}</p>
                              <p className="text-sm text-muted-foreground">
                                {data.totalShifts} shifts • {data.totalBills} bills
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{formatCurrency(data.totalSales)}</p>
                              <p className="text-sm text-muted-foreground">
                                {data.totalShifts > 0 ? formatCurrency(data.totalSales / data.totalShifts) : formatCurrency(0)} avg
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </TabsContent>
            
            <TabsContent value="active" className="space-y-6">
              {loading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading active shifts...</span>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Available Cashiers */}
                  {availableCashiers && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Available Cashiers</span>
                          <Badge variant="secondary">
                            {availableCashiers.availableCashiers.length} available
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {availableCashiers.availableCashiers.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableCashiers.availableCashiers.map((cashier: any) => (
                              <div key={cashier._id} className="p-4 border rounded-lg">
                                <p className="font-medium">{cashier.user.name}</p>
                                <p className="text-sm text-muted-foreground">{cashier.user.employeeId}</p>
                                <p className="text-sm text-muted-foreground">{cashier.user.email}</p>
                                <Badge variant="outline" className="mt-2">
                                  {cashier.employmentDetails.department}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-4">
                            No available cashiers. All cashiers are currently on active shifts.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Active Shifts */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Currently Active Shifts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {activeShifts.length > 0 ? (
                        <div className="space-y-4">
                          {activeShifts.map((shift) => (
                            <div key={shift._id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <p className="font-medium">{shift.cashier?.name || "Unknown"}</p>
                                <p className="text-sm text-muted-foreground">
                                  ID: {shift.cashier?.employeeId || "N/A"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Started: {new Date(shift.startTime).toLocaleString()}
                                </p>
                                <div className="flex gap-4 mt-2">
                                  <span className="text-sm">Sales: {formatCurrency(shift.totalSales)}</span>
                                  <span className="text-sm">Bills: {shift.totalBills}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-green-600 mb-2">Active</Badge>
                                <br />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleForceEndShift(shift._id)}
                                >
                                  Force End
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          No active shifts at the moment.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="temporary" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Assign Temporary Cashier
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Absent Cashier</label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={selectedAbsentCashier}
                        onChange={(e) => setSelectedAbsentCashier(e.target.value)}
                      >
                        <option value="">Select absent cashier...</option>
                        {allEmployees
                          .filter(emp => activeShifts.some(shift => shift.cashier?._id === emp.user._id))
                          .map((employee) => (
                            <option key={employee._id} value={employee.user._id}>
                              {employee.user.name} ({employee.user.employeeId})
                            </option>
                          ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Temporary Cashier</label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={selectedTemporaryCashier}
                        onChange={(e) => setSelectedTemporaryCashier(e.target.value)}
                      >
                        <option value="">Select temporary cashier...</option>
                        {allEmployees
                          .filter(emp => !activeShifts.some(shift => shift.cashier?._id === emp.user._id))
                          .map((employee) => (
                            <option key={employee._id} value={employee.user._id}>
                              {employee.user.name} ({employee.user.employeeId})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reason for Assignment</label>
                    <textarea 
                      className="w-full p-2 border rounded-md"
                      rows={3}
                      placeholder="e.g., Employee on medical leave, personal emergency, etc."
                      value={assignmentReason}
                      onChange={(e) => setAssignmentReason(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleTemporaryAssignment}
                      disabled={isAssigning || !selectedAbsentCashier || !selectedTemporaryCashier || !assignmentReason}
                    >
                      {isAssigning ? "Assigning..." : "Assign Temporary Cashier"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Current Temporary Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Temporary Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-4">
                    No active temporary assignments at the moment.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
