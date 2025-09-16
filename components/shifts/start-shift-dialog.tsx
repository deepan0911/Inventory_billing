"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Play } from "lucide-react"

interface StartShiftDialogProps {
  isOpen: boolean
  onClose: () => void
  onStartShift: (openingCash: number) => Promise<void>
}

export function StartShiftDialog({ isOpen, onClose, onStartShift }: StartShiftDialogProps) {
  const [openingCash, setOpeningCash] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const cashAmount = Number.parseFloat(openingCash)
    if (isNaN(cashAmount) || cashAmount < 0) {
      setError("Please enter a valid opening cash amount")
      return
    }

    setIsLoading(true)
    try {
      await onStartShift(cashAmount)
      setOpeningCash("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start shift")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setOpeningCash("")
      setError("")
      onClose()
    }
  }

  const quickAmounts = [0, 500, 1000, 2000, 5000]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Start New Shift
          </DialogTitle>
          <DialogDescription>
            Enter the opening cash amount in the register to start your shift. This will be used to calculate the
            expected cash at the end of your shift.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="openingCash">Opening Cash Amount</Label>
            <Input
              id="openingCash"
              type="number"
              step="0.01"
              min="0"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              placeholder="0.00"
              required
              disabled={isLoading}
              className="text-lg"
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label>Quick Amounts</Label>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpeningCash(amount.toString())}
                  disabled={isLoading}
                  className="text-xs"
                >
                  ₹{amount}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Shift
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
