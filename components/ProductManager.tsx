
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { Product } from '../types';

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ProductManager: React.FC<Props> = ({ products, setProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    size: '',
    color: '',
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
    reorderPoint: 5
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...formData, id: p.id } as Product : p));
    } else {
      setProducts([...products, { ...formData, id: Date.now().toString() } as Product]);
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', size: '', color: '', buyPrice: 0, sellPrice: 0, stock: 0, reorderPoint: 5 });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('آیا از حذف این محصول اطمینان دارید؟')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.includes(searchTerm) || p.color.includes(searchTerm)
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="جستجوی محصول..." 
            className="w-full pr-10 pl-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          <span>افزودن محصول جدید</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-4">نام کالا</th>
              <th className="px-6 py-4">سایز / رنگ</th>
              <th className="px-6 py-4">قیمت خرید</th>
              <th className="px-6 py-4">قیمت فروش</th>
              <th className="px-6 py-4">موجودی</th>
              <th className="px-6 py-4">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-800">{product.name}</td>
                <td className="px-6 py-4 text-slate-600">{product.size} / {product.color}</td>
                <td className="px-6 py-4">{new Intl.NumberFormat('fa-IR').format(product.buyPrice)}</td>
                <td className="px-6 py-4">{new Intl.NumberFormat('fa-IR').format(product.sellPrice)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    product.stock <= product.reorderPoint ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {product.stock} عدد
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(product)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
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
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-slate-800">{editingProduct ? 'ویرایش محصول' : 'محصول جدید'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">نام محصول</label>
                  <input required type="text" className="w-full px-4 py-2 border rounded-xl outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">سایز</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-xl outline-none" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رنگ</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-xl outline-none" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">قیمت خرید (ریال)</label>
                  <input required type="number" className="w-full px-4 py-2 border rounded-xl outline-none" value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">قیمت فروش (ریال)</label>
                  <input required type="number" className="w-full px-4 py-2 border rounded-xl outline-none" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">موجودی اولیه</label>
                  <input required type="number" className="w-full px-4 py-2 border rounded-xl outline-none" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">نقطه سفارش</label>
                  <input required type="number" className="w-full px-4 py-2 border rounded-xl outline-none" value={formData.reorderPoint} onChange={e => setFormData({...formData, reorderPoint: Number(e.target.value)})} />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                  ذخیره اطلاعات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
