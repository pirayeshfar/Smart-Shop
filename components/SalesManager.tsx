import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  Minus,
  Trash2, 
  ShoppingBag, 
  Percent, 
  ReceiptText, 
  User as UserIcon,
  Search,
  ChevronDown,
  X,
  Package,
  Tag,
  Palette,
  Ruler,
  AlertCircle,
  Check,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Product, Sale, User } from '../types';
import { DB } from '../services/db';

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  currentUser?: User | null;
}

const SalesManager: React.FC<Props> = ({ products, setProducts, sales, setSales, currentUser }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [quantity, setQuantity] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const isAdmin = !currentUser || currentUser.role === 'ADMIN';

  // بستن منوی جستجو با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // فیلتر فروش بر اساس نقش کاربر (مدیر کل فروش‌ها را می‌بیند، فروشنده فقط فروش‌های خودش را)
  const visibleSales = useMemo(() => {
    if (isAdmin) {
      return sales;
    }
    return sales.filter(s => 
      (s.sellerId && s.sellerId === currentUser?.id) ||
      (s.sellerName && currentUser?.fullName && s.sellerName.trim() === currentUser.fullName.trim())
    );
  }, [sales, currentUser, isAdmin]);

  // مجموع کارکرد ریالی فروش‌های قابل مشاهده
  const totalVisibleAmount = useMemo(() => {
    return visibleSales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [visibleSales]);

  // فیلتر هوشمند محصولات بر اساس نام، کد، سایز و رنگ
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase().trim();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.size && p.size.toLowerCase().includes(q)) ||
      (p.color && p.color.toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  const subtotal = selectedProduct ? selectedProduct.sellPrice * quantity : 0;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const amountAfterDiscount = subtotal - discountAmount;
  const taxAmount = Math.round(amountAfterDiscount * (taxPercent / 100));
  const finalTotal = amountAfterDiscount + taxAmount;
  const profit = selectedProduct ? amountAfterDiscount - (selectedProduct.buyPrice * quantity) : 0;

  const handleSelectProduct = (p: Product) => {
    if (p.stock <= 0) return;
    setSelectedProductId(p.id);
    setQuantity(1);
    setIsDropdownOpen(false);
    setProductSearch('');
  };

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || isProcessing) return;

    if (selectedProduct.stock < quantity) {
      alert('موجودی کالای انتخابی کافی نیست!');
      return;
    }

    setIsProcessing(true);

    const newSale: Sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount: finalTotal,
      profit,
      sellerId: currentUser?.id,
      sellerName: currentUser?.fullName
    };

    const updatedProduct = { ...selectedProduct, stock: selectedProduct.stock - quantity };

    try {
      await Promise.all([
        DB.addSale(newSale),
        DB.upsertProduct(updatedProduct)
      ]);

      setSales([newSale, ...sales]);
      setProducts(products.map(p => p.id === selectedProduct.id ? updatedProduct : p));
      
      setSelectedProductId('');
      setQuantity(1);
      setDiscountPercent(0);
      setTaxPercent(0);
    } catch (err) {
      console.error(err);
      alert('خطا در ثبت تراکنش فاکتور!');
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
      {/* فرم ثبت فاکتور جدید */}
      <div className="lg:col-span-1">
        <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-24 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">ثبت فاکتور جدید</h2>
              <p className="text-xs text-slate-400 font-bold mt-0.5">جستجو و انتخاب کالا با مشخصات دقیق</p>
            </div>
          </div>

          <form onSubmit={handleSale} className="space-y-5">
            {/* انتخاب‌گر هوشمند کالا */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                انتخاب کالا از انبار
              </label>

              {!selectedProduct ? (
                <div>
                  {/* دکمه بازکننده منو و کادر جستجو */}
                  <div 
                    onClick={() => setIsDropdownOpen(true)}
                    className={`w-full px-4 py-3.5 bg-slate-50 border ${isDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200'} rounded-2xl flex items-center justify-between cursor-pointer transition-all`}
                  >
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                      <Search size={18} className="text-indigo-500" />
                      <span>{productSearch ? productSearch : 'جستجوی نام، کد، سایز یا رنگ کالا...'}</span>
                    </div>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {/* منوی دراپ‌داون محصولات */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 left-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] max-h-80 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* کادر ورود متن جستجو */}
                      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="text"
                            autoFocus
                            placeholder="تایپ کنید (نام، کد، سایز، رنگ)..."
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                            className="w-full pr-9 pl-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                          />
                          {productSearch && (
                            <button 
                              type="button" 
                              onClick={() => setProductSearch('')}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* لیست محصولات با سایز، رنگ و کد */}
                      <div className="overflow-y-auto custom-scrollbar flex-1 divide-y divide-slate-100">
                        {filteredProducts.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 space-y-2">
                            <Package size={36} className="mx-auto opacity-20" />
                            <p className="text-xs font-bold">هیچ کالایی با این مشخصات یافت نشد!</p>
                          </div>
                        ) : (
                          filteredProducts.map(p => {
                            const isOutOfStock = p.stock <= 0;
                            return (
                              <div 
                                key={p.id}
                                onClick={() => handleSelectProduct(p)}
                                className={`p-3.5 transition-colors flex items-center justify-between gap-3 ${
                                  isOutOfStock 
                                    ? 'bg-slate-50/60 opacity-60 cursor-not-allowed' 
                                    : 'hover:bg-indigo-50/50 cursor-pointer'
                                }`}
                              >
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      {p.code}
                                    </span>
                                    <span className="font-black text-slate-800 text-xs truncate">
                                      {p.name}
                                    </span>
                                  </div>

                                  {/* نمایش سایز و رنگ */}
                                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                    {p.size && (
                                      <span className="inline-flex items-center gap-1 text-slate-600 bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        <Ruler size={10} className="text-indigo-500" />
                                        سایز: {p.size}
                                      </span>
                                    )}
                                    {p.color && (
                                      <span className="inline-flex items-center gap-1 text-slate-600 bg-emerald-50/70 border border-emerald-100 px-2 py-0.5 rounded-md font-bold">
                                        <Palette size={10} className="text-emerald-500" />
                                        رنگ: {p.color}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="text-left shrink-0">
                                  <span className="block font-black text-indigo-600 text-xs">
                                    {new Intl.NumberFormat('fa-IR').format(p.sellPrice)} ریال
                                  </span>
                                  {isOutOfStock ? (
                                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
                                      اتمام موجودی
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                      موجودی: {p.stock} عدد
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* کارت مشخصات کامل کالای انتخاب‌شده */
                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3 relative">
                  <button 
                    type="button" 
                    onClick={() => setSelectedProductId('')}
                    className="absolute top-3 left-3 p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
                    title="تغییر کالا"
                  >
                    <X size={16} />
                  </button>

                  <div className="pr-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                        {selectedProduct.code}
                      </span>
                      <h4 className="font-black text-slate-900 text-sm">
                        {selectedProduct.name}
                      </h4>
                    </div>

                    {/* مشخصات سایز و رنگ کالا */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                        <Ruler size={12} className="text-indigo-600" />
                        سایز: {selectedProduct.size || 'نامشخص'}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                        <Palette size={12} className="text-emerald-600" />
                        رنگ: {selectedProduct.color || 'نامشخص'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-indigo-100/80 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">قیمت واحد:</span>
                    <span className="font-black text-indigo-700 text-sm">
                      {new Intl.NumberFormat('fa-IR').format(selectedProduct.sellPrice)} ریال
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                    <span>موجودی فعلی انبار:</span>
                    <span className="font-black">{selectedProduct.stock} عدد</span>
                  </div>
                </div>
              )}
            </div>

            {/* انتخاب تعداد */}
            {selectedProduct && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  تعداد سفارش
                </label>
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                  <button 
                    type="button" 
                    onClick={() => setQuantity(prev => Math.min(selectedProduct.stock, prev + 1))}
                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black"
                  >
                    <Plus size={16} />
                  </button>
                  <input 
                    type="number" 
                    min="1" 
                    max={selectedProduct.stock}
                    value={quantity}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, Math.min(selectedProduct.stock, val)));
                    }}
                    className="w-full text-center bg-transparent font-black text-lg text-slate-800 outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="p-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all font-black"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* تخفیف و مالیات */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider text-rose-500">
                  تخفیف (٪)
                </label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 bg-rose-50/40 border border-rose-100 rounded-2xl text-center font-black text-rose-600 outline-none" 
                  value={discountPercent} 
                  onChange={e => setDiscountPercent(Number(e.target.value))} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider text-emerald-600">
                  مالیات (٪)
                </label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 bg-emerald-50/40 border border-emerald-100 rounded-2xl text-center font-black text-emerald-600 outline-none" 
                  value={taxPercent} 
                  onChange={e => setTaxPercent(Number(e.target.value))} 
                />
              </div>
            </div>

            {/* خلاصه صورت‌حساب فاکتور */}
            {selectedProduct && (
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
                  <span>جمع کل کالایی:</span>
                  <span>{new Intl.NumberFormat('fa-IR').format(subtotal)} ریال</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-rose-400 font-bold">
                    <span>مبلغ تخفیف:</span>
                    <span>- {new Intl.NumberFormat('fa-IR').format(discountAmount)} ریال</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-400 font-bold">
                    <span>مالیات بر ارزش افزوده:</span>
                    <span>+ {new Intl.NumberFormat('fa-IR').format(taxAmount)} ریال</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-800 pt-3 mt-2">
                  <span className="font-black text-xs text-slate-200">مبلغ نهایی فاکتور:</span>
                  <span className="font-black text-lg text-indigo-400">
                    {new Intl.NumberFormat('fa-IR').format(finalTotal)} ریال
                  </span>
                </div>
              </div>
            )}

            <button 
              disabled={!selectedProduct || isProcessing} 
              type="submit" 
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20 text-xs"
            >
              {isProcessing ? 'در حال ثبت...' : 'تایید و ثبت نهایی فاکتور'}
            </button>
          </form>
        </div>
      </div>

      {/* گزارش فاکتورها */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden space-y-0">
          <div className="p-7 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                {isAdmin ? 'گزارش کلی فاکتورهای فروش' : 'سوابق و فاکتورهای فروش من'}
              </h2>
              <p className="text-xs text-slate-400 font-bold mt-1">
                {isAdmin 
                  ? 'مشاهده تمامی فاکتورهای ثبت شده توسط کلیه فروشندگان' 
                  : `لیست اختصاصی فاکتورهای ثبت شده توسط ${currentUser?.fullName || 'شما'} از ابتدا تاکنون`}
              </p>
            </div>

            {/* بج‌های خلاصه عملکرد */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-indigo-50 text-indigo-700 font-black text-xs px-3.5 py-2 rounded-xl border border-indigo-100/60 flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-500" />
                <span>{visibleSales.length} فاکتور</span>
              </span>

              <span className="bg-emerald-50 text-emerald-700 font-black text-xs px-3.5 py-2 rounded-xl border border-emerald-100/60 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-500" />
                <span>کل کارکرد: {new Intl.NumberFormat('fa-IR').format(totalVisibleAmount)} ریال</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs uppercase font-black border-b border-slate-100">
                  <th className="px-6 py-4">تاریخ</th>
                  <th className="px-6 py-4">عنوان محصول</th>
                  <th className="px-6 py-4 text-center">تعداد</th>
                  <th className="px-6 py-4">فروشنده</th>
                  <th className="px-6 py-4 font-black">مبلغ نهایی</th>
                  <th className="px-6 py-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {visibleSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 font-bold text-xs">
                      {isAdmin 
                        ? 'هیچ فاکتوری در سیستم ثبت نشده است.' 
                        : 'شما هنوز هیچ فاکتوری ثبت نکرده‌اید.'}
                    </td>
                  </tr>
                ) : (
                  visibleSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 text-xs font-bold">
                        {new Date(sale.date).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-800">
                        {sale.productName}
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-700">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                          {sale.quantity} عدد
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-bold">
                        {sale.sellerName ? (
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs">
                            <UserIcon size={12} className="text-indigo-500" />
                            {sale.sellerName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">سیستمی</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-black text-indigo-600 text-base">
                        {new Intl.NumberFormat('fa-IR').format(sale.totalAmount)} ریال
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button 
                            onClick={() => handleDeleteSale(sale)} 
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            title="ابطال فاکتور"
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
        </div>
      </div>
    </div>
  );
};

export default SalesManager;
