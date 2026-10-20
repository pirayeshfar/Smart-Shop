import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Sparkles, RefreshCw, CheckCircle2, Tag } from 'lucide-react';
import { Product } from '../types';
import { DB } from '../services/db';

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

// جدول تبدیل حروف فارسی به حروف انگلیسی برای پیشوند کد کالا
const PERSIAN_TO_LATIN: Record<string, string> = {
  'ا': 'A', 'آ': 'A', 'ب': 'B', 'پ': 'P', 'ت': 'T', 'ث': 'S',
  'ج': 'J', 'چ': 'CH', 'ح': 'H', 'خ': 'KH', 'د': 'D', 'ذ': 'Z',
  'ر': 'R', 'ز': 'Z', 'ژ': 'ZH', 'س': 'S', 'ش': 'SH', 'ص': 'S',
  'ض': 'Z', 'ط': 'T', 'ظ': 'Z', 'ع': 'A', 'غ': 'GH', 'ف': 'F',
  'ق': 'GH', 'ک': 'K', 'گ': 'G', 'ل': 'L', 'م': 'M', 'ن': 'N',
  'و': 'V', 'ه': 'H', 'ی': 'Y', 'ئ': 'Y'
};

// استانداردسازی نام برای تطابق هوشمند
const normalizeName = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\u064A\u0649]/g, 'ی')
    .replace(/[\u0643]/g, 'ک')
    .replace(/\s+/g, ' ');
};

// تابع تولید خودکار کد کالا بر اساس نام و توالی شماره
export const generateSmartProductCode = (
  productName: string,
  existingProducts: Product[],
  currentEditingId?: string
): string => {
  const trimmed = productName.trim();
  if (!trimmed) return '';

  const normalizedInput = normalizeName(trimmed);

  // ۱. بررسی کالاهایی که با همین نام دقیق قبلاً در سیستم ثبت شده‌اند
  const sameNameProducts = existingProducts.filter(p => 
    p.id !== currentEditingId && normalizeName(p.name) === normalizedInput
  );

  let prefix = '';
  let highestSameNameNumber = 0;

  if (sameNameProducts.length > 0) {
    // استخراج پیشوند و بالاترین شماره قبلی از کالاهای هم‌نام
    for (const p of sameNameProducts) {
      const match = p.code?.match(/^([A-Za-z0-9]+)[-_](\d+)$/);
      if (match) {
        if (!prefix) {
          prefix = match[1].toUpperCase();
        }
        const num = parseInt(match[2], 10);
        if (!isNaN(num) && num > highestSameNameNumber) {
          highestSameNameNumber = num;
        }
      }
    }
  }

  // ۲. اگر پیشوندی پیدا نشد، از حرف اول نام کالا پیشوند بساز
  if (!prefix) {
    const firstChar = trimmed.charAt(0);
    if (PERSIAN_TO_LATIN[firstChar]) {
      prefix = PERSIAN_TO_LATIN[firstChar];
    } else if (/[a-zA-Z]/.test(firstChar)) {
      prefix = firstChar.toUpperCase();
    } else {
      prefix = 'P';
    }
  }

  // ۳. استخراج تمام شماره‌های استفاده شده با این پیشوند در کل انبار
  const usedNumbers = new Set<number>();
  const prefixRegex = new RegExp(`^${prefix}[-_](\\d+)$`, 'i');

  existingProducts.forEach(p => {
    if (p.id === currentEditingId) return;
    const match = p.code?.match(prefixRegex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) {
        usedNumbers.add(num);
      }
    }
  });

  // اگر کالای هم‌نام وجود داشت، حداقل یک شماره بالاتر از آن می‌گذاریم (مثلاً اگر B-001 بوده، B-002 شود)
  let candidateNum = highestSameNameNumber > 0 ? highestSameNameNumber + 1 : 1;

  // اطمینان از اینکه شماره کاندید با هیچ کالای دیگری در انبار تداخل ندارد
  while (usedNumbers.has(candidateNum)) {
    candidateNum++;
  }

  const paddedNum = candidateNum.toString().padStart(3, '0');
  return `${prefix}-${paddedNum}`;
};

const ProductManager: React.FC<Props> = ({ products, setProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoCode, setIsAutoCode] = useState(true);

  const [formData, setFormData] = useState<Partial<Product>>({
    code: '', name: '', size: '', color: '', buyPrice: 0, sellPrice: 0, stock: 0, reorderPoint: 5
  });

  // هنگام تغییر نام کالا، در صورت فعال بودن حالت خودکار، کد کالا هوشمند ساخته می‌شود
  const handleNameChange = (nameValue: string) => {
    const updated: Partial<Product> = { ...formData, name: nameValue };
    if (isAutoCode && (!editingProduct || !formData.code)) {
      const autoCode = generateSmartProductCode(nameValue, products, editingProduct?.id);
      if (autoCode) {
        updated.code = autoCode;
      }
    }
    setFormData(updated);
  };

  // تولید مجدد کد با زدن دکمه هوشمند
  const handleRegenerateCode = () => {
    if (!formData.name) return;
    const autoCode = generateSmartProductCode(formData.name, products, editingProduct?.id);
    setFormData(prev => ({ ...prev, code: autoCode }));
    setIsAutoCode(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    let finalCode = formData.code?.trim();

    // اگر کد کالا خالی بود، خودکار تولید شود
    if (!finalCode && formData.name) {
      finalCode = generateSmartProductCode(formData.name, products, editingProduct?.id);
    }

    const isDuplicate = products.some(p => p.code?.toLowerCase() === finalCode?.toLowerCase() && p.id !== editingProduct?.id);
    if (isDuplicate) {
      alert('این کد محصول قبلاً در سیستم ثبت شده است. لطفاً کد دیگری انتخاب کنید.');
      setIsSaving(false);
      return;
    }

    const finalProduct = (editingProduct 
      ? { ...formData, code: finalCode, id: editingProduct.id } 
      : { ...formData, code: finalCode, id: Date.now().toString() }) as Product;

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
      alert('خطا در ذخیره‌سازی محصول!');
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setIsAutoCode(true);
    setFormData({ code: '', name: '', size: '', color: '', buyPrice: 0, sellPrice: 0, stock: 0, reorderPoint: 5 });
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsAutoCode(true);
    setFormData({ code: '', name: '', size: '', color: '', buyPrice: 0, sellPrice: 0, stock: 0, reorderPoint: 5 });
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsAutoCode(false);
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
            className="w-full pr-10 pl-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-right text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          <span className="font-bold text-xs">افزودن محصول جدید</span>
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
                <td className="px-6 py-4 font-mono text-slate-600 font-black text-right text-xs">
                  <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {product.code}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-800 text-right">{product.name}</td>
                <td className="px-6 py-4 text-slate-600 text-right">{product.size} / {product.color}</td>
                <td className="px-6 py-4 font-bold text-indigo-600 text-right">
                  {new Intl.NumberFormat('fa-IR').format(product.sellPrice)} ریال
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    product.stock <= product.reorderPoint ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {product.stock} عدد
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(product)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="ویرایش">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="حذف">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-7 border-b">
              <div>
                <h2 className="text-xl font-black text-slate-800">{editingProduct ? 'ویرایش کالا' : 'تعریف کالای جدید'}</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">ثبت مشخصات و تولید خودکار کد کالا بر اساس نام</p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-7 space-y-5 text-right">
              <div className="grid grid-cols-2 gap-5">
                {/* نام محصول (اولین فیلد ورودی تا بر اساس آن کد کالا تولید شود) */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 mr-1">
                    نام محصول <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    required 
                    type="text" 
                    placeholder="مثلاً: بارانی بلند، شلوار جین..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-right font-bold text-xs" 
                    value={formData.name || ''} 
                    onChange={e => handleNameChange(e.target.value)} 
                  />
                </div>

                {/* کد محصول با تولید خودکار هوشمند */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1.5 mr-1">
                    <label className="block text-xs font-bold text-slate-700">
                      کد انحصاری کالا <span className="text-rose-500">*</span>
                    </label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      <Sparkles size={12} />
                      تولید خودکار بر اساس نام
                    </span>
                  </div>
                  <div className="relative">
                    <input 
                      required 
                      type="text" 
                      placeholder="تولید خودکار بر اساس نام کالا (مثلاً B-001)"
                      className="w-full px-4 py-3 bg-indigo-50/30 border border-indigo-200 font-mono font-black text-xs text-indigo-900 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-right pl-24" 
                      value={formData.code || ''} 
                      onChange={e => {
                        setFormData({ ...formData, code: e.target.value });
                        setIsAutoCode(false);
                      }} 
                    />
                    {formData.name && (
                      <button
                        type="button"
                        onClick={handleRegenerateCode}
                        className="absolute left-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black flex items-center gap-1 transition-all"
                        title="تولید مجدد بر اساس نام"
                      >
                        <RefreshCw size={12} />
                        <span>تولید مجدد</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 mr-1">
                    کد کالا به‌صورت خودکار و ترتیبی ایجاد می‌شود (اگر نام تکراری باشد شماره بعدی مانند B-002 اختصاص می‌یابد).
                  </p>
                </div>
                
                {/* سایز و رنگ */}
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">سایز</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-right text-xs" 
                    value={formData.size || ''} 
                    onChange={e => setFormData({...formData, size: e.target.value})} 
                    placeholder="مثلاً L یا 42" 
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">رنگ</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-right text-xs" 
                    value={formData.color || ''} 
                    onChange={e => setFormData({...formData, color: e.target.value})} 
                    placeholder="مثلاً مشکی" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">قیمت خرید (ریال)</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-right font-bold text-xs" 
                    value={formData.buyPrice || ''} 
                    onChange={e => setFormData({...formData, buyPrice: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">قیمت فروش (ریال)</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-right font-bold text-xs text-indigo-700" 
                    value={formData.sellPrice || ''} 
                    onChange={e => setFormData({...formData, sellPrice: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">موجودی انبار</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-right font-bold text-xs" 
                    value={formData.stock ?? ''} 
                    onChange={e => setFormData({...formData, stock: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">نقطه هشدار سفارش</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-right font-bold text-xs" 
                    value={formData.reorderPoint ?? 5} 
                    onChange={e => setFormData({...formData, reorderPoint: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <button 
                disabled={isSaving} 
                type="submit" 
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20 text-xs mt-2"
              >
                {isSaving ? 'در حال ذخیره...' : 'ذخیره محصول در انبار'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
