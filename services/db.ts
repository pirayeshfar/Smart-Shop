
import { Product, Sale, Expense } from '../types';

const KEYS = {
  PRODUCTS: 'shop_products',
  SALES: 'shop_sales',
  EXPENSES: 'shop_expenses'
};

export const DB = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },
  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },
  getSales: (): Sale[] => {
    const data = localStorage.getItem(KEYS.SALES);
    return data ? JSON.parse(data) : [];
  },
  saveSales: (sales: Sale[]) => {
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
  },
  getExpenses: (): Expense[] => {
    const data = localStorage.getItem(KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
  },
  saveExpenses: (expenses: Expense[]) => {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  }
};
