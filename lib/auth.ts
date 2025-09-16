interface User {
  id: string
  name: string
  email: string
  role: "admin" | "cashier"
  employeeId: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface AuthResponse {
  token: string
  user: User
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

export class AuthService {
  private static instance: AuthService
  private token: string | null = null
  private user: User | null = null

  private constructor() {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("pos_token")
      const userData = localStorage.getItem("pos_user")
      if (userData) {
        try {
          this.user = JSON.parse(userData)
        } catch (error) {
          console.error("Error parsing user data:", error)
          this.clearAuth()
        }
      }
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Login failed")
      }

      const data: AuthResponse = await response.json()

      // Store auth data
      this.token = data.token
      this.user = data.user

      if (typeof window !== "undefined") {
        localStorage.setItem("pos_token", data.token)
        localStorage.setItem("pos_user", JSON.stringify(data.user))
      }

      return data
    } catch (error) {
      throw error
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (!response.ok) {
        this.clearAuth()
        return null
      }

      const user = await response.json()
      this.user = user

      if (typeof window !== "undefined") {
        localStorage.setItem("pos_user", JSON.stringify(user))
      }

      return user
    } catch (error) {
      console.error("Error fetching current user:", error)
      this.clearAuth()
      return null
    }
  }

  logout(): void {
    this.clearAuth()
  }

  private clearAuth(): void {
    this.token = null
    this.user = null

    if (typeof window !== "undefined") {
      localStorage.removeItem("pos_token")
      localStorage.removeItem("pos_user")
    }
  }

  getToken(): string | null {
    return this.token
  }

  getUser(): User | null {
    return this.user
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user
  }

  isAdmin(): boolean {
    return this.user?.role === "admin"
  }

  isCashier(): boolean {
    return this.user?.role === "cashier"
  }
}

export const authService = AuthService.getInstance()
