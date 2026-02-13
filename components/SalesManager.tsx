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
      await DB.deleteSale(sale.id);
      setSales(sales.filter(s => s.id !== sale.id));
      setProducts(products.map(p => p.id === sale.productId ? { ...p, stock: p.stock + sale.quantity } : p));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border sticky top-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <ShoppingBag size={24} />
            </div>
            <h2 className="text-xl font-black text-slate-800">ثبت فاکتور جدید</h2>
          </div>
          <form onSubmit={handleSale} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 uppercase tracking-widest">انتخاب محصول</label>
              <select 
                required
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
              >
                <option value="">جستجو و انتخاب...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                    [{p.code}] {p.name} ({p.color}) - {p.stock} موجود
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 uppercase tracking-widest">تعداد فروش</label>
              <input 
                required
                type="number" 
                min="1"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-black"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
              />
            </div>

            {selectedProductId && (
              <div className="p-5 bg-indigo-50/50 rounded-2xl space-y-3 border border-indigo-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">قیمت واحد:</span>
                  <span className="font-black text-slate-700">{new Intl.NumberFormat('fa-IR').format(products.find(p => p.id === selectedProductId)?.sellPrice || 0)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-indigo-100 pt-3 mt-3">
                  <span className="font-black text-slate-800">مجموع فاکتور:</span>
                  <div className="flex flex-col items-end">
                    <span className="font-black text-xl text-indigo-600">
                      {new Intl.NumberFormat('fa-IR').format((products.find(p => p.id === selectedProductId)?.sellPrice || 0) * quantity)}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-400">ریال</span>
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              تایید و چاپ فاکتور
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
          <div className="p-7 border-b flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800">گزارش فروش اخیر</h2>
            <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
              {sales.length} تراکنش ثبت شده
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">تاریخ</th>
                  <th className="px-6 py-4">محصول</th>
                  <th className="px-6 py-4">تعداد</th>
                  <th className="px-6 py-4">مبلغ نهایی</th>
                  <th className="px-6 py-4">سود خالص</th>
                  <th className="px-6 py-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-300 font-bold">هیچ تراکنشی در تاریخچه یافت نشد.</td>
                  </tr>
                ) : (
                  sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {new Date(sale.date).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-800">{sale.productName}</td>
                      <td className="px-6 py-4 font-bold">{sale.quantity} عدد</td>
                      <td className="px-6 py-4 font-black text-slate-900">{new Intl.NumberFormat('fa-IR').format(sale.totalAmount)}</td>
                      <td className="px-6 py-4 text-emerald-600 font-black">{new Intl.NumberFormat('fa-IR').format(sale.profit)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button onClick={() => handleDeleteSale(sale)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors" title="ابطال فاکتور">
                            <Trash2 size={16} />
                          </button>
                        </div>
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