import React, { useState } from 'react';
import { Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Product, Sale } from '../types';
import { DB } from '../services/db';

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
}

const SalesManager: React.FC<Props> = ({ products, setProducts, sales, setSales }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleSale = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (product.stock < quantity) {
      alert('موجودی کالا کافی نیست!');
      return;
    }

    const totalAmount = product.sellPrice * quantity;
    const profit = (product.sellPrice - product.buyPrice) * quantity;

    const newSale: Sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      quantity,
      totalAmount,
      profit
    };

    setSales([newSale, ...sales]);
    setProducts(products.map(p => p.id === product.id ? { ...p, stock: p.stock - quantity } : p));
    
    setSelectedProductId('');
    setQuantity(1);
  };

  const handleDeleteSale = async (sale: Sale) => {
    if (window.confirm('آیا از ابطال این فاکتور اطمینان دارید؟ موجودی به انبار بازگشت داده می‌شود.')) {
      // حذف از دیتابیس
      await DB.deleteSale(sale.id);
      
      // بروزرسانی استیت
      setSales(sales.filter(s => s.id !== sale.id));
      setProducts(products.map(p => p.id === sale.productId ? { ...p, stock: p.stock + sale.quantity } : p));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl shadow-sm border sticky top-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ShoppingBag size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">ثبت فروش جدید</h2>
          </div>
          <form onSubmit={handleSale} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">انتخاب کالا</label>
              <select 
                required
                className="w-full px-4 py-2 border rounded-xl outline-none bg-white"
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
              >
                <option value="">یک محصول انتخاب کنید...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                    {p.name} ({p.color}) - موجودی: {p.stock}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">تعداد</label>
              <input 
                required
                type="number" 
                min="1"
                className="w-full px-4 py-2 border rounded-xl outline-none"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
              />
            </div>

            {selectedProductId && (
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">قیمت واحد:</span>
                  <span className="font-bold">{new Intl.NumberFormat('fa-IR').format(products.find(p => p.id === selectedProductId)?.sellPrice || 0)}</span>
                </div>
                <div className="flex justify-between text-base border-t pt-2 mt-2">
                  <span className="font-bold text-slate-800">مبلغ کل:</span>
                  <span className="font-bold text-indigo-600">
                    {new Intl.NumberFormat('fa-IR').format((products.find(p => p.id === selectedProductId)?.sellPrice || 0) * quantity)} ریال
                  </span>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              ثبت فاکتور
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-slate-800">تاریخچه فروش</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">تاریخ</th>
                  <th className="px-6 py-4">محصول</th>
                  <th className="px-6 py-4">تعداد</th>
                  <th className="px-6 py-4">مبلغ کل</th>
                  <th className="px-6 py-4">سود</th>
                  <th className="px-6 py-4">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">هنوز هیچ فروشی ثبت نشده است.</td>
                  </tr>
                ) : (
                  sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(sale.date).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{sale.productName}</td>
                      <td className="px-6 py-4">{sale.quantity} عدد</td>
                      <td className="px-6 py-4 font-bold">{new Intl.NumberFormat('fa-IR').format(sale.totalAmount)}</td>
                      <td className="px-6 py-4 text-emerald-600">{new Intl.NumberFormat('fa-IR').format(sale.profit)}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleDeleteSale(sale)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesManager;