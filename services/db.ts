
import { createClient } from '@supabase/supabase-js';
import { Product, Sale, Expense, User } from '../types';

const supabaseUrl = "https://xhogilmkyykccowcjlak.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhob2dpbG1reXlrY2Nvd2NqbGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzc0NTksImV4cCI6MjA4MzIxMzQ1OX0._9iJoCX3H03M4rF0xBKDXKGbOoXXL6L-tAe_s9mnPE4";

let supabase: any = null;

try {
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (err) {
  console.error('❌ خطا در اتصال به Supabase:', err);
}

const COMMISSIONS_KEY = 'smart_shop_user_commissions';
const SALES_META_KEY = 'smart_shop_sales_meta';
const SYS_SALES_META_ID = '__SYS_SALES_META__';
const SYS_COMMISSIONS_ID = '__SYS_COMMISSIONS__';

export const DB = {
  isConnected: () => !!supabase,

  // مدیریت حافظه محلی و ابری برای پورسانت‌ها
  getStoredCommissions: (): Record<string, number> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(COMMISSIONS_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('خطا در خواندن درصد پورسانت‌ها از حافظه محلی:', e);
    }
    return {};
  },

  fetchCloudCommissions: async (): Promise<Record<string, number>> => {
    let cloudRates: Record<string, number> = {};
    if (supabase) {
      try {
        const { data } = await supabase.from('expenses').select('description').eq('id', SYS_COMMISSIONS_ID).single();
        if (data && data.description) {
          cloudRates = JSON.parse(data.description);
        }
      } catch {
        // ignore
      }
    }
    const local = DB.getStoredCommissions();
    const merged = { ...local, ...cloudRates };
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(merged));
    }
    return merged;
  },

  setStoredCommission: async (userId: string, rate: number) => {
    try {
      const rates = DB.getStoredCommissions();
      rates[userId] = rate;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(rates));
      }
      if (supabase) {
        await supabase.from('expenses').upsert({
          id: SYS_COMMISSIONS_ID,
          date: new Date().toISOString(),
          description: JSON.stringify(rates),
          amount: 0
        });
      }
    } catch (e) {
      console.warn('خطا در ذخیره درصد پورسانت:', e);
    }
  },

  setStoredCommissionsBulk: async (newRates: Record<string, number>) => {
    try {
      const rates = { ...DB.getStoredCommissions(), ...newRates };
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(rates));
      }
      if (supabase) {
        await supabase.from('expenses').upsert({
          id: SYS_COMMISSIONS_ID,
          date: new Date().toISOString(),
          description: JSON.stringify(rates),
          amount: 0
        });
      }
    } catch (e) {
      console.warn('خطا در ذخیره یکجای پورسانت‌ها:', e);
    }
  },

  // متادیتاهای صادرکننده فاکتورها (همگام‌سازی ابری و محلی)
  getStoredSalesMeta: (): Record<string, { sellerId?: string; sellerName?: string }> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(SALES_META_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('خطا در خواندن مشخصات فروشندگان فاکتورها:', e);
    }
    return {};
  },

  fetchCloudSalesMeta: async (): Promise<Record<string, { sellerId?: string; sellerName?: string }>> => {
    let cloudMeta: Record<string, { sellerId?: string; sellerName?: string }> = {};
    if (supabase) {
      try {
        const { data } = await supabase.from('expenses').select('description').eq('id', SYS_SALES_META_ID).single();
        if (data && data.description) {
          cloudMeta = JSON.parse(data.description);
        }
      } catch {
        // ignore
      }
    }
    const local = DB.getStoredSalesMeta();
    const merged = { ...local, ...cloudMeta };
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(SALES_META_KEY, JSON.stringify(merged));
    }
    return merged;
  },

  setStoredSaleMeta: async (saleId: string, meta: { sellerId?: string; sellerName?: string }) => {
    try {
      const allMeta = DB.getStoredSalesMeta();
      allMeta[saleId] = meta;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SALES_META_KEY, JSON.stringify(allMeta));
      }
      if (supabase) {
        await supabase.from('expenses').upsert({
          id: SYS_SALES_META_ID,
          date: new Date().toISOString(),
          description: JSON.stringify(allMeta),
          amount: 0
        });
      }
    } catch (e) {
      console.warn('خطا در ذخیره مشخصات فروشنده فاکتور:', e);
    }
  },

  setStoredSalesMetaBulk: async (newEntries: Record<string, { sellerId?: string; sellerName?: string }>) => {
    try {
      const allMeta = { ...DB.getStoredSalesMeta(), ...newEntries };
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SALES_META_KEY, JSON.stringify(allMeta));
      }
      if (supabase) {
        await supabase.from('expenses').upsert({
          id: SYS_SALES_META_ID,
          date: new Date().toISOString(),
          description: JSON.stringify(allMeta),
          amount: 0
        });
      }
    } catch (e) {
      console.warn('خطا در ذخیره دسته‌ای مشخصات فروشندگان:', e);
    }
  },

  getUsers: async (): Promise<User[]> => {
    let usersList: User[] = [];
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) {
        usersList = data;
      }
    }
    // ادغام درصد پورسانت‌های ذخیره شده ابری با داده‌های کاربران
    const savedRates = await DB.fetchCloudCommissions();
    return usersList.map(u => ({
      ...u,
      commissionRate: savedRates[u.id] !== undefined 
        ? savedRates[u.id] 
        : (typeof u.commissionRate === 'number' ? u.commissionRate : 5)
    }));
  },

  saveUser: async (user: User) => {
    // ابتدا در حافظه محلی ذخیره می‌کنیم تا بلافاصله پایدار بماند
    if (typeof user.commissionRate === 'number') {
      DB.setStoredCommission(user.id, user.commissionRate);
    }

    if (!supabase) return;
    const userPayload: any = {
      id: user.id,
      username: user.username,
      password: user.password,
      role: user.role,
      fullName: user.fullName
    };
    if (typeof user.commissionRate === 'number') {
      userPayload.commissionRate = user.commissionRate;
    }

    const { error } = await supabase.from('users').upsert(userPayload);
    if (error && userPayload.commissionRate !== undefined) {
      // اگر جدول ریموت ستون commissionRate نداشت، بدون آن در دیتابیس ثبت می‌شود
      delete userPayload.commissionRate;
      await supabase.from('users').upsert(userPayload);
    }
  },

  saveUserCommission: async (userId: string, rate: number) => {
    DB.setStoredCommission(userId, rate);
    if (!supabase) return;
    // تلاش برای به‌روزرسانی ستون ریموت در صورت وجود
    try {
      await supabase.from('users').update({ commissionRate: rate }).eq('id', userId);
    } catch {
      // اگر ستون ریموت وجود نداشت خطایی ندهد
    }
  },

  deleteUser: async (id: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const rates = DB.getStoredCommissions();
        delete rates[id];
        localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(rates));
      }
    } catch {
      // ignore
    }
    if (!supabase) return;
    await supabase.from('users').delete().eq('id', id);
  },

  getProducts: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
    if (error) return [];
    return data || [];
  },

  upsertProduct: async (product: Product) => {
    if (!supabase) return;
    // استفاده از نام‌های دقیق ستون‌ها برای جلوگیری از خطای Schema Cache
    const { error } = await supabase.from('products').upsert({
      id: product.id,
      code: product.code,
      name: product.name,
      size: product.size,
      color: product.color,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      stock: product.stock,
      reorderPoint: product.reorderPoint
    });
    
    if (error) {
      console.error('Database Error:', error.message);
      throw error;
    }
  },

  upsertProducts: async (productsList: Product[]) => {
    if (!supabase || productsList.length === 0) return;
    const payload = productsList.map(product => ({
      id: product.id,
      code: product.code,
      name: product.name,
      size: product.size,
      color: product.color,
      buyPrice: product.buyPrice ?? 0,
      sellPrice: product.sellPrice ?? 0,
      stock: product.stock,
      reorderPoint: product.reorderPoint
    }));
    
    const { error } = await supabase.from('products').upsert(payload);
    if (error) {
      console.warn('Supabase bulk upsert failed, falling back to sequential upsert:', error.message);
      for (const prod of productsList) {
        await DB.upsertProduct(prod);
      }
    }
  },

  deleteProduct: async (id: string) => {
    if (!supabase) return;
    await supabase.from('products').delete().eq('id', id);
  },

  getSales: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('sales').select('*').order('date', { ascending: false });
    if (error) return [];
    const salesList: Sale[] = data || [];
    
    // دریافت اطلاعات فروشنده (sellerId, sellerName) هم از کلاد و هم از حافظه محلی
    const salesMeta = await DB.fetchCloudSalesMeta();

    return salesList.map(s => {
      // ۱. اگر فروشنده در آی‌دی فاکتور کدگذاری شده باشد
      let encodedSellerId: string | undefined;
      let encodedSellerName: string | undefined;
      if (s.id && s.id.includes('__s_')) {
        const parts = s.id.split('__');
        for (const p of parts) {
          if (p.startsWith('s_')) encodedSellerId = p.slice(2);
          if (p.startsWith('n_')) {
            try {
              encodedSellerName = decodeURIComponent(p.slice(2));
            } catch {
              encodedSellerName = p.slice(2);
            }
          }
        }
      }

      const meta = salesMeta[s.id];
      const sellerId = encodedSellerId || s.sellerId || meta?.sellerId;
      const sellerName = encodedSellerName || s.sellerName || meta?.sellerName;

      return {
        ...s,
        sellerId: sellerId || undefined,
        sellerName: sellerName || undefined
      };
    });
  },

  addSale: async (sale: Sale) => {
    // ذخیره مشخصات فروشنده در حافظه کلاد و محلی
    if (sale.sellerId || sale.sellerName) {
      await DB.setStoredSaleMeta(sale.id, {
        sellerId: sale.sellerId,
        sellerName: sale.sellerName
      });
    }

    if (!supabase) return;
    const salePayload: any = {
      id: sale.id,
      date: sale.date,
      productId: sale.productId,
      productName: sale.productName,
      quantity: sale.quantity,
      subtotal: sale.subtotal,
      discountAmount: sale.discountAmount,
      taxAmount: sale.taxAmount,
      totalAmount: sale.totalAmount,
      profit: sale.profit
    };
    if (sale.sellerId) salePayload.sellerId = sale.sellerId;
    if (sale.sellerName) salePayload.sellerName = sale.sellerName;

    const { error } = await supabase.from('sales').insert(salePayload);
    if (error) {
      console.warn('Supabase addSale primary attempt:', error.message);
      // Fallback in case remote database table does not have sellerId/sellerName columns
      const { error: fallbackError } = await supabase.from('sales').insert({
        id: sale.id,
        date: sale.date,
        productId: sale.productId,
        productName: sale.productName,
        quantity: sale.quantity,
        subtotal: sale.subtotal,
        discountAmount: sale.discountAmount,
        taxAmount: sale.taxAmount,
        totalAmount: sale.totalAmount,
        profit: sale.profit
      });
      if (fallbackError) throw fallbackError;
    }
  },

  updateSale: async (sale: Sale) => {
    // بروزرسانی مشخصات فروشنده در حافظه کلاد و محلی
    if (sale.sellerId || sale.sellerName) {
      await DB.setStoredSaleMeta(sale.id, {
        sellerId: sale.sellerId,
        sellerName: sale.sellerName
      });
    }

    if (!supabase) return;
    const salePayload: any = {
      date: sale.date,
      productId: sale.productId,
      productName: sale.productName,
      quantity: sale.quantity,
      subtotal: sale.subtotal,
      discountAmount: sale.discountAmount,
      taxAmount: sale.taxAmount,
      totalAmount: sale.totalAmount,
      profit: sale.profit
    };
    if (sale.sellerId) salePayload.sellerId = sale.sellerId;
    if (sale.sellerName) salePayload.sellerName = sale.sellerName;

    const { error } = await supabase.from('sales').update(salePayload).eq('id', sale.id);
    if (error) {
      console.warn('Supabase updateSale primary attempt:', error.message);
      // Fallback in case remote database table does not have sellerId/sellerName columns
      const { error: fallbackError } = await supabase.from('sales').update({
        date: sale.date,
        productId: sale.productId,
        productName: sale.productName,
        quantity: sale.quantity,
        subtotal: sale.subtotal,
        discountAmount: sale.discountAmount,
        taxAmount: sale.taxAmount,
        totalAmount: sale.totalAmount,
        profit: sale.profit
      }).eq('id', sale.id);
      if (fallbackError) throw fallbackError;
    }
  },

  deleteSale: async (id: string) => {
    try {
      const salesMeta = DB.getStoredSalesMeta();
      delete salesMeta[id];
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SALES_META_KEY, JSON.stringify(salesMeta));
      }
      if (supabase) {
        await supabase.from('expenses').upsert({
          id: SYS_SALES_META_ID,
          date: new Date().toISOString(),
          description: JSON.stringify(salesMeta),
          amount: 0
        });
      }
    } catch {
      // ignore
    }
    if (!supabase) return;
    await supabase.from('sales').delete().eq('id', id);
  },

  getExpenses: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (error) return [];
    const list: Expense[] = data || [];
    return list.filter(e => !e.id.startsWith('__SYS_'));
  },

  addExpense: async (expense: Expense) => {
    if (!supabase) return;
    const { error } = await supabase.from('expenses').insert(expense);
    if (error) throw error;
  },

  deleteExpense: async (id: string) => {
    if (!supabase) return;
    await supabase.from('expenses').delete().eq('id', id);
  }
};
