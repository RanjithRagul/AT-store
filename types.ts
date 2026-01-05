export enum UserRole {
  USER = 'USER',
  OWNER = 'OWNER'
}

export interface User {
  id: string;
  phoneNumber: string;
  role: UserRole;
  name?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string; // Optional, can use placeholder
  expiryDate?: string; // ISO Date string
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  date: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface CheckoutResult {
  success: boolean;
  message: string;
  orderId?: string;
  outOfStockItems?: string[]; // IDs of items that failed
}