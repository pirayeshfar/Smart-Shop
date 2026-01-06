
export type Role = 'ADMIN' | 'SALESPERSON';

export interface User {
  id: string;
  username: string;
  password: string;
  role: Role;
  fullName: string;
}

export interface Product {
  id: string;
  name: string;
  size: string;
  color: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  reorderPoint: number;
}

export interface Sale {
  id: string;
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  profit: number;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  PRODUCTS = 'PRODUCTS',
  SALES = 'SALES',
  EXPENSES = 'EXPENSES',
  AI_INSIGHTS = 'AI_INSIGHTS',
  USER_MANAGEMENT = 'USER_MANAGEMENT'
}
