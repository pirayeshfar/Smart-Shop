
import React, { useState } from 'react';
import { Plus, Trash2, ShoppingBag, Percent, ReceiptText } from 'lucide-react';
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
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const product = products.find(p => p.id === selectedProductId);

  const subtotal = product ? product.sellPrice * quantity : 0;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const amountAfterDiscount = subtotal - discountAmount;
  const taxAmount = Math.round(amountAfterDiscount * (taxPercent / 100));
  const finalTotal = amountAfterDiscount + taxAmount;
  const profit = product ? amountAfterDiscount - (product.buyPrice * quantity) : 0;

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || isProcessing) return;

    if (product.stock < quantity) {
      alert('موجودی کالا کافی نیست!');
      return;
    }

    setIsProcessing(true);

    const newSale: Sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      quantity,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount: finalTotal,
      profit
    };

    const updatedProduct = { ...product, stock: product.stock - quantity };

    try {
      // ذخیره فروش و بروزرسانی انبار به صورت همزمان
      await Promise.all([
        DB.addSale(newSale),
        DB.upsertProduct(updatedProduct)
      ]);

      setSales([newSale, ...sales]);
      setProducts(products.map(p => p.id === product.id ? updatedProduct : p));
      
      setSelectedProductId('');
      setQuantity(1);
      setDiscountPercent(0);
      setTaxPercent(0);
    } catch (err) {
      console.error(err);
      alert('خطا در ثبت تراکنش!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSale = async (sale: Sale) => {
    if (window.confirm('آیا از ابطال این فاکتور اطمینان دارید؟ موجودی به انبار بازگشت داده می‌شود.')) {
      const productToRestore = products.find(p => p.id === sale.productId);
      if (productToRestore) {
        const restoredProduct = { ...productToRestore, stock: productToRestore.stock + sale.quantity };
        await Promise.all([
          DB.deleteSale(sale.id),
          DB.upsertProduct(restoredProduct)
        ]);
        setProducts(products.map(p => p.id === sale.productId ? restoredProduct : p));
      } else {
        await DB.deleteSale(sale.id);
      }
      setSales(sales.filter(s => s.id !== sale.id));
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
          <form onSubmit={handleSale} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">انتخاب محصول</label>
              <select 
                required
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
              >
                <option value="">جستجو و انتخاب...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                    [{p.code}] {p.name} - {p.stock} موجود
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest text-rose-500">تخفیف (%)</label>
                <input type="number" className="w-full px-4 py-3 bg-rose-50/30 border border-rose-100 rounded-2xl text-center font-black" value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest text-emerald-600">مالیات (%)</label>
                <input type="number" className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-center font-black" value={taxPercent} onChange={e => setTaxPercent(Number(e.target.value))} />
              </div>
            </div>

            {selectedProductId && (
              <div className="p-5 bg-indigo-50/50 rounded-2xl space-y-3 border border-indigo-100">
                <div className="flex justify-between items-center border-t border-indigo-100 pt-3 mt-3">
                  <span className="font-black text-slate-800">مبلغ نهایی فاکتور:</span>
                  <span className="font-black text-xl text-indigo-600">
                    {new Intl.NumberFormat('fa-IR').format(finalTotal)} ریال
                  </span>
                </div>
              </div>
            )}

            <button disabled={isProcessing} type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">
              {isProcessing ? 'در حال ثبت...' : 'تایید و ثبت نهایی'}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
          <div className="p-7 border-b flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800">گزارش فروش اخیر</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">تاریخ</th>
                  <th className="px-6 py-4">محصول</th>
                  <th className="px-6 py-4 font-black">مبلغ نهایی</th>
                  <th className="px-6 py-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {sales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{new Date(sale.date).toLocaleDateString('fa-IR')}</td>
                    <td className="px-6 py-4 font-black text-slate-800">{sale.productName}</td>
                    <td className="px-6 py-4 font-black text-indigo-600 text-lg">{new Intl.NumberFormat('fa-IR').format(sale.totalAmount)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button onClick={() => handleDeleteSale(sale)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesManager;
