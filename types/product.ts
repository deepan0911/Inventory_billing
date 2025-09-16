export interface ProductVariant {
  _id?: string
  size: string
  price: number
  cost: number
  stock: number
  barcode?: string
  sku: string
  isActive: boolean
}

export interface Product {
  _id: string
  code: string
  name: string
  barcode?: string
  category: string
  basePrice: number
  baseCost: number
  unit: string
  taxRate: number
  isActive: boolean
  variants: ProductVariant[]
  createdAt: string
  updatedAt: string
}
