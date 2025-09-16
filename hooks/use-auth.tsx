"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { authService } from "@/lib/auth"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "cashier"
  employeeId: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isCashier: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { user: loggedInUser } = await authService.login({ email, password })
      setUser(loggedInUser)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setIsLoading(true)
    authService.logout()
    setUser(null)
    // Add a small delay to ensure state is cleared before UI updates
    setTimeout(() => {
      setIsLoading(false)
    }, 100)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    isAdmin: user?.role === "admin",
    isCashier: user?.role === "cashier",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
