export interface Employee {
  _id: string
  user: {
    _id: string
    name: string
    email: string
    employeeId: string
    role: string
    isActive: boolean
  }
  personalDetails: {
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    bloodGroup?: string
  }
  contactDetails: {
    phone: string
    emergencyPhone?: string
    address: {
      street: string
      city: string
      state: string
      postalCode: string
      country: string
    }
  }
  identification: {
    aadhaarNumber: string
    panNumber?: string
    aadhaarCard?: {
      filename: string
      path: string
      uploadedAt: string
    }
    panCard?: {
      filename: string
      path: string
      uploadedAt: string
    }
    photo?: {
      filename: string
      path: string
      uploadedAt: string
    }
  }
  employmentDetails: {
    department: string
    position: string
    dateOfJoining: string
    salary: number
    bankAccount?: {
      accountNumber: string
      bankName: string
      ifscCode: string
      branchName: string
    }
  }
  status: string
  leaveBalance?: {
    casual: number
    sick: number
    earned: number
  }
  createdAt: string
  updatedAt: string
}
