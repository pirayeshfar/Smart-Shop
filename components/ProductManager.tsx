import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Layers, 
  AlertTriangle,
  Info
} from 'lucide-react';
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
export const normalizeName = (name: string): string => {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/[\u064A\u0649]/g, 'ی')
    .replace(/[\u0643]/g, 'ک')
    .replace(/\s+/g, ' ');
};

// دریافت پیشوند نام محصول
export const getPrefixForName = (name: string): string => {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'P';
  const firstChar = trimmed.charAt(0);
  if (PERSIAN_TO_LATIN[firstChar]) {
    return PERSIAN_TO_LATIN[firstChar];
  } else if (/[a-zA-Z]/.test(firstChar)) {
    return firstChar.toUpperCase();
  }
  return 'P';
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
    prefix = getPrefixForName(trimmed);
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

type SortField = 'code' | 'name' | 'sizeColor' | 'sellPrice' | 'stock';
type SortDirection = 'asc' | 'desc';

const ProductManager: React.FC<Props> = ({ products, setProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoCode, setIsAutoCode] = useState(true);

  // وضعیت مرتب‌سازی ستون‌ها (Sort)
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // وضعیت مدال مرتب‌سازی مجدد کلیه کدهای انبار
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    code: '', 
    name: '', 
    size: '', 
    color: '', 
    buyPrice: 0, 
    sellPrice: 0, 
    stock: 0, 
    reorderPoint: 5
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

  // کنترل تغییر قیمت‌ها با جداسازی ۳ رقم ۳ رقم اعداد
  const handlePriceInput = (field: 'buyPrice' | 'sellPrice', valueStr: string) => {
    const rawDigits = valueStr.replace(/[^0-9]/g, '');
    const numValue = rawDigits === '' ? 0 : parseInt(rawDigits, 10);
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  // فرمت سه رقم سه رقم برای فیلد ورودی قیمت
  const formatInputValue = (num: number | undefined) => {
    if (num === undefined || num === 0) return '';
    return num.toLocaleString('en-US');
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
      alert('این کد محصول قبلاً در سیستم ثبت شده است. لطفاً کد دیگری انتخاب کنید یا دکمه تولید خودکار را بزنید.');
      setIsSaving(false);
      return;
    }

    const finalProduct = (editingProduct 
      ? { 
          ...formData, 
          code: finalCode, 
          buyPrice: Number(formData.buyPrice) || 0,
          sellPrice: Number(formData.sellPrice) || 0,
          stock: Number(formData.stock) || 0,
          reorderPoint: Number(formData.reorderPoint) || 5,
          id: editingProduct.id 
        } 
      : { 
          ...formData, 
          code: finalCode, 
          buyPrice: Number(formData.buyPrice) || 0,
          sellPrice: Number(formData.sellPrice) || 0,
          stock: Number(formData.stock) || 0,
          reorderPoint: Number(formData.reorderPoint) || 5,
          id: Date.now().toString() 
        }) as Product;

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
    setFormData({
      ...product,
      buyPrice: product.buyPrice ?? 0,
      sellPrice: product.sellPrice ?? 0
    });
    setIsAutoCode(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('آیا از حذف این محصول اطمینان دارید؟')) {
      await DB.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // مرتب‌سازی با کلیک بر روی عنوان ستون
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // تابع مرتب‌سازی و تنظیم مجدد کلیه کدهای کالا بر اساس کل لیست انبار
  const handleReorganizeAllCodes = async () => {
    if (products.length === 0) return;
    setIsReordering(true);

    try {
      // محصولات را بر اساس نام کالا و سپس سایز مرتب می‌کنیم تا اقلام هم‌نام کنار هم قرار گیرند
      const sortedList = [...products].sort((a, b) => {
        const cmpName = (a.name || '').localeCompare(b.name || '', 'fa');
        if (cmpName !== 0) return cmpName;
        return (a.size || '').localeCompare(b.size || '', 'fa');
      });

      // ردیابی شمارنده توالی برای هر پیشوند
      const prefixCounters: Record<string, number> = {};

      const updatedProducts: Product[] = sortedList.map(item => {
        const prefix = getPrefixForName(item.name);
        const currentCount = (prefixCounters[prefix] || 0) + 1;
        prefixCounters[prefix] = currentCount;

        const paddedSeq = currentCount.toString().padStart(3, '0');
        const newCode = `${prefix}-${paddedSeq}`;

        return {
          ...item,
          code: newCode
        };
      });

      // ذخیره‌سازی در دیتابیس
      await DB.upsertProducts(updatedProducts);
      setProducts(updatedProducts);

      setReorderSuccessMsg(`کدهای تمامی ${updatedProducts.length} کالای موجود در انبار بر اساس حروف الفبا و نام کالا به‌صورت منظم و استاندارد مرتب‌سازی و ذخیره شدند.`);
      setTimeout(() => {
        setReorderSuccessMsg(null);
      }, 6000);
      setIsReorderModalOpen(false);
    } catch (err) {
      console.error('Error reordering product codes:', err);
      alert('خطا در مرتب‌سازی کدهای انبار');
    } finally {
      setIsReordering(false);
    }
  };

  // فیلتر و مرتب‌سازی محصولات
  const processedProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = products.filter(p => 
      (p.name && p.name.toLowerCase().includes(term)) || 
      (p.code && p.code.toLowerCase().includes(term)) ||
      (p.color && p.color.toLowerCase().includes(term)) ||
      (p.size && p.size.toLowerCase().includes(term))
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'code': {
          const codeA = a.code || '';
          const codeB = b.code || '';
          comparison = codeA.localeCompare(codeB, 'en', { numeric: true });
          break;
        }
        case 'name': {
          comparison = (a.name || '').localeCompare(b.name || '', 'fa');
          break;
        }
        case 'sizeColor': {
          const scA = `${a.size || ''} ${a.color || ''}`;
          const scB = `${b.size || ''} ${b.color || ''}`;
          comparison = scA.localeCompare(scB, 'fa');
          break;
        }
        case 'sellPrice': {
          comparison = (a.sellPrice || 0) - (b.sellPrice || 0);
          break;
        }
        case 'stock': {
          comparison = (a.stock || 0) - (b.stock || 0);
          break;
        }
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [products, searchTerm, sortField, sortDirection]);

  // رندر آیکون جهت مرتب‌سازی ستون
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="text-slate-300 group-hover:text-slate-500 transition-colors mr-1.5" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={14} className="text-indigo-600 mr-1.5" />
      : <ArrowDown size={14} className="text-indigo-600 mr-1.5" />;
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden relative">
      
      {/* پیام موقت موفقیت مرتب‌سازی مجدد کدهای انبار */}
      {reorderSuccessMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center justify-between animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5 text-emerald-800 text-xs font-black">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{reorderSuccessMsg}</span>
          </div>
          <button onClick={() => setReorderSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold">
            <X size={16} />
          </button>
        </div>
      )}

      {/* بخش سرچ و اکشن‌های بالای لیست — حالت استاندارد و عادی */}
      <div className="bg-white px-6 py-4 border-b border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* فیلد جستجو با دکمه پاک‌کردن سریع */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="جستجوی سریع کد کالا، نام، رنگ یا سایز..." 
              className="w-full pr-10 pl-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold text-right text-xs transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                title="پاک‌کردن جستجو"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <span className="hidden sm:inline-flex shrink-0 text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
            {processedProducts.length} از {products.length} کالا
          </span>
        </div>

        {/* دکمه‌های عملیاتی: تنظیم مجدد کدها و افزودن محصول جدید */}
        <div className="flex items-center gap-2.5 self-end md:self-auto w-full md:w-auto">
          {/* دکمه هوشمند مرتب‌سازی مجدد کدهای انبار بر اساس کل لیست */}
          <button
            onClick={() => setIsReorderModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl transition-all border border-slate-200 text-xs font-black shadow-xs active:scale-95"
            title="مرتب‌سازی و اصلاح کدهای نامنظم بر اساس کل لیست"
          >
            <RotateCcw size={16} className="text-slate-600" />
            <span>تنظیم مجدد کدهای انبار</span>
          </button>

          {/* دکمه افزودن محصول جدید */}
          <button 
            onClick={handleOpenAddModal}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 text-xs font-black active:scale-95"
          >
            <Plus size={18} />
            <span>افزودن محصول جدید</span>
          </button>
        </div>
      </div>

      {/* جدول اقلام انبار */}
      <div className="overflow-x-auto min-h-[350px]">
        <table className="w-full text-right border-collapse">
          {/* سرستون‌های قابل کلیک برای مرتب‌سازی (Sort) در حالت عادی و استاندارد */}
          <thead className="bg-slate-50 text-slate-600 text-xs font-black border-b border-slate-200">
            <tr>
              <th 
                onClick={() => handleSort('code')}
                className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
                title="کلیک برای مرتب‌سازی بر اساس کد کالا"
              >
                <div className="flex items-center">
                  <span>کد کالا</span>
                  {renderSortIcon('code')}
                </div>
              </th>

              <th 
                onClick={() => handleSort('name')}
                className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
                title="کلیک برای مرتب‌سازی بر اساس نام کالا"
              >
                <div className="flex items-center">
                  <span>نام کالا</span>
                  {renderSortIcon('name')}
                </div>
              </th>

              <th 
                onClick={() => handleSort('sizeColor')}
                className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
                title="کلیک برای مرتب‌سازی بر اساس سایز و رنگ"
              >
                <div className="flex items-center">
                  <span>سایز / رنگ</span>
                  {renderSortIcon('sizeColor')}
                </div>
              </th>

              <th 
                onClick={() => handleSort('sellPrice')}
                className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
                title="کلیک برای مرتب‌سازی بر اساس قیمت فروش"
              >
                <div className="flex items-center text-indigo-700">
                  <span>قیمت فروش</span>
                  {renderSortIcon('sellPrice')}
                </div>
              </th>

              <th 
                onClick={() => handleSort('stock')}
                className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
                title="کلیک برای مرتب‌سازی بر اساس موجودی انبار"
              >
                <div className="flex items-center">
                  <span>موجودی</span>
                  {renderSortIcon('stock')}
                </div>
              </th>

              <th className="px-6 py-4 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {processedProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search size={32} className="text-slate-300 stroke-1" />
                    <p className="font-black text-sm text-slate-600">هیچ محصولی یافت نشد</p>
                    <p className="text-[11px] text-slate-400 font-bold">عبارت جستجو را تغییر دهید یا محصول جدیدی ثبت کنید</p>
                  </div>
                </td>
              </tr>
            ) : (
              processedProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-black text-slate-700 text-right">
                    <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                      {product.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-800 text-right">{product.name}</td>
                  <td className="px-6 py-4 text-slate-600 font-bold text-right">
                    {product.size || product.color ? `${product.size || '—'} / ${product.color || '—'}` : '—'}
                  </td>
                  <td className="px-6 py-4 font-black text-right">
                    {product.sellPrice && product.sellPrice > 0 ? (
                      <span className="text-indigo-600">
                        {new Intl.NumberFormat('fa-IR').format(product.sellPrice)} تومان
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        ۰ تومان (بدون قیمت)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black inline-block ${
                      product.stock <= product.reorderPoint 
                        ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {product.stock} عدد
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleEdit(product)} 
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" 
                        title="ویرایش کالا"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)} 
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" 
                        title="حذف کالا"
                      >
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

      {/* مدال تایید و اجرای مرتب‌سازی مجدد کدهای انبار */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-7 space-y-4 text-right">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <RotateCcw size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">تنظیم و مرتب‌سازی مجدد کدهای انبار</h3>
                <p className="text-xs text-slate-500 font-bold mt-2 leading-relaxed">
                  این عملیات کدهای تمام <span className="text-indigo-600 font-black">{products.length}</span> کالای انبار را بر اساس نام کالا و حروف الفبا به‌صورت منظم و ترتیبی (مانند B-001، B-002، ...) بازنشانی و شماره‌گذاری می‌کند.
                </p>
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 font-bold flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>اگر قبلاً کدهای نامرتب، دستی یا تکراری ثبت کرده‌اید، همگی به‌صورت دقیق و بدون تداخل هماهنگ خواهند شد.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  disabled={isReordering}
                  onClick={handleReorganizeAllCodes}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-black text-xs transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isReordering ? 'در حال مرتب‌سازی...' : 'بله، مرتب‌سازی و اعمال کن'}
                </button>
                <button
                  type="button"
                  disabled={isReordering}
                  onClick={() => setIsReorderModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-colors"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مدال افزودن / ویرایش کالا */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-7 border-b">
              <div>
                <h2 className="text-xl font-black text-slate-800">{editingProduct ? 'ویرایش کالا' : 'تعریف کالای جدید'}</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">ثبت مشخصات و تولید خودکار کد کالا بر اساس نام</p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
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
                    placeholder="مثلاً: بارانی بلند، شلوار جین، پیراهن کتان..."
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

                {/* قیمت خرید با جداسازی ۳ رقم ۳ رقم */}
                <div className="col-span-1">
                  <div className="flex items-center justify-between mb-1.5 mr-1">
                    <label className="block text-xs font-bold text-slate-600">قیمت خرید (تومان)</label>
                    <span className="text-[10px] text-slate-400 font-bold">پیش‌فرض: ۰</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="0"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-right font-mono font-bold text-xs pl-14 focus:ring-2 focus:ring-indigo-500" 
                      value={formatInputValue(formData.buyPrice)} 
                      onChange={e => handlePriceInput('buyPrice', e.target.value)} 
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">تومان</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 mr-1">
                    {formData.buyPrice && formData.buyPrice > 0 
                      ? `${new Intl.NumberFormat('fa-IR').format(formData.buyPrice)} تومان` 
                      : '۰ تومان (رایگان / ثبت نشده)'}
                  </p>
                </div>

                {/* قیمت فروش با جداسازی ۳ رقم ۳ رقم و پیش‌فرض صفر اختیاری */}
                <div className="col-span-1">
                  <div className="flex items-center justify-between mb-1.5 mr-1">
                    <label className="block text-xs font-bold text-slate-600">قیمت فروش (تومان)</label>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">اختیاری (پیش‌فرض ۰)</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="0"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-right font-mono font-bold text-xs text-indigo-700 pl-14 focus:ring-2 focus:ring-indigo-500" 
                      value={formatInputValue(formData.sellPrice)} 
                      onChange={e => handlePriceInput('sellPrice', e.target.value)} 
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">تومان</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 mr-1">
                    {formData.sellPrice && formData.sellPrice > 0 
                      ? `${new Intl.NumberFormat('fa-IR').format(formData.sellPrice)} تومان` 
                      : '۰ تومان (فعلاً بدون قیمت)'}
                  </p>
                </div>

                {/* موجودی انبار */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">
                    موجودی انبار <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-right font-bold text-xs focus:ring-2 focus:ring-indigo-500" 
                    value={formData.stock ?? 0} 
                    onChange={e => setFormData({...formData, stock: e.target.value === '' ? 0 : Number(e.target.value)})} 
                  />
                </div>

                {/* نقطه هشدار سفارش */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">
                    نقطه هشدار سفارش <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    placeholder="5"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-right font-bold text-xs focus:ring-2 focus:ring-indigo-500" 
                    value={formData.reorderPoint ?? 5} 
                    onChange={e => setFormData({...formData, reorderPoint: e.target.value === '' ? 0 : Number(e.target.value)})} 
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
