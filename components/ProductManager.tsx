
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { Product } from '../types';
import { DB } from '../services/db';

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ProductManager: React.FC<Props> = ({ products, setProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Product>>({
    code: '', name: '', size: '', color: '', buyPrice: 0, sellPrice: 0, stock: 0, reorderPoint: 5
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const isDuplicate = products.some(p => p.code === formData.code && p.id !== editingProduct?.id);
    if (isDuplicate) {
      alert('این کد محصول قبلاً در سیستم ثبت شده است. لطفاً کد دیگری انتخاب کنید.');
      setIsSaving(false);
      return;
    }

    const finalProduct = (editingProduct 
      ? { ...formData, id: editingProduct.id } 
      : { ...formData, id: Date.now().toString() }) as Product;

    try {
      await DB.upsertProduct(finalProduct);
      
      if (editingProduct) {
        setProducts(products.map(p => p.id === editingProduct.id ? finalProduct : p));
      } else {
        setProducts([...products, finalProduct]);
      }
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ code: '', name: '', size: '', color: '', buyPrice: 0, sellPrice: 0, stock: 0, reorderPoint: 5 });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('آیا از حذف این محصول اطمینان دارید؟')) {
      await DB.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.includes(searchTerm) || 
    p.code.includes(searchTerm) ||
    p.color.includes(searchTerm)
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="جستجوی کد یا نام..." 
            className="w-full pr-10 pl-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-right"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          <span className="font-bold">افزودن محصول جدید</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-4 text-right">کد کالا</th>
              <th className="px-6 py-4 text-right">نام کالا</th>
              <th className="px-6 py-4 text-right">سایز / رنگ</th>
              <th className="px-6 py-4 text-right font-bold text-indigo-600">قیمت فروش</th>
              <th className="px-6 py-4 text-right">موجودی</th>
              <th className="px-6 py-4 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-500 text-right">{product.code}</td>
                <td className="px-6 py-4 font-bold text-slate-800 text-right">{product.name}</td>
                <td className="px-6 py-4 text-slate-600 text-right">{product.size} / {product.color}</td>
                <td className="px-6 py-4 font-bold text-indigo-600 text-right">{new Intl.NumberFormat('fa-IR').format(product.sellPrice)}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    product.stock <= product.reorderPoint ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {product.stock} عدد
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(product)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-7 border-b">
              <h2 className="text-xl font-black text-slate-800">{editingProduct ? 'ویرایش کالا' : 'تعریف کالای جدید'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-7 space-y-5 text-right">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">کد محصول</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-right" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">نام محصول</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-right" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                {/* بخش سایز و رنگ که بازگشته است */}
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">سایز</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-right" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} placeholder="مثلاً L یا 42" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">رنگ</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-right" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="مثلاً مشکی" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">قیمت خرید</label>
                  <input required type="number" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none text-right" value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">قیمت فروش</label>
                  <input required type="number" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none text-right" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">موجودی</label>
                  <input required type="number" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none text-right" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">نقطه سفارش</label>
                  <input required type="number" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none text-right" value={formData.reorderPoint} onChange={e => setFormData({...formData, reorderPoint: Number(e.target.value)})} />
                </div>
              </div>
              <button disabled={isSaving} type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20">
                {isSaving ? 'در حال ذخیره...' : 'ذخیره محصول'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
