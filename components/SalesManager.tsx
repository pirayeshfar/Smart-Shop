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
  FileText,
  Edit3,
  Printer,
  Eye,
  ShieldCheck,
  Award,
  Layers,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  UserCheck,
  Filter
} from 'lucide-react';
import { Product, Sale, User } from '../types';
import { DB } from '../services/db';

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  currentUser?: User | null;
  users?: User[];
}

const SalesManager: React.FC<Props> = ({ products, setProducts, sales, setSales, currentUser, users = [] }) => {
  // فرم ثبت فاکتور جدید
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [quantity, setQuantity] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // پیام اعلان موقت
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // تب فعال در حالت نمایش (کامل، فقط صدور، یا فقط فاکتورها)
  const [activeTab, setActiveTab] = useState<'both' | 'form' | 'invoices'>('both');

  // فیلتر فروشنده برای مدیر
  const [sellerFilter, setSellerFilter] = useState<'ALL' | 'UNASSIGNED' | string>('ALL');

  // جستجو در جدول فاکتورها
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');

  // مدال پیش‌نمایش و چاپ فاکتور
  const [viewingInvoice, setViewingInvoice] = useState<Sale | null>(null);

  // مدال ویرایش فاکتور
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editProductId, setEditProductId] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editDiscountPercent, setEditDiscountPercent] = useState(0);
  const [editTaxPercent, setEditTaxPercent] = useState(0);
  const [editSellerName, setEditSellerName] = useState('');
  const [editSellerId, setEditSellerId] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // مدال تایید حذف فاکتور
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const isAdmin = !currentUser || currentUser.role === 'ADMIN';

  // فرمت‌بندی کد نمایش فاکتور (استخراج از شناسه کدگذاری‌شده)
  const getCleanInvoiceCode = (id: string) => {
    if (!id) return '#---';
    const base = id.split('__')[0].split('@')[0];
    return '#' + base.slice(-6);
  };

  // بستن منوی جستجوی کالا با کلیک خارج
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // مدیریت پیام اعلان خودکار
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // فیلتر فاکتورها بر اساس نقش کاربر (مدیر همه را می‌بیند، فروشنده فقط فاکتورهای خودش را)
  const visibleSales = useMemo(() => {
    if (isAdmin) {
      if (sellerFilter === 'ALL') return sales;
      if (sellerFilter === 'UNASSIGNED') {
        return sales.filter(s => !s.sellerName || s.sellerName.includes('مدیر') || s.sellerId === 'admin-id');
      }
      return sales.filter(s => 
        (s.sellerId && s.sellerId === sellerFilter) ||
        (s.sellerName && users.find(u => u.id === sellerFilter)?.fullName === s.sellerName)
      );
    }
    return sales.filter(s => 
      (s.sellerId && currentUser?.id && (s.sellerId === currentUser.id || s.sellerId === currentUser.username)) ||
      (s.sellerName && currentUser?.fullName && (
        s.sellerName.trim() === currentUser.fullName.trim() ||
        s.sellerName.includes(currentUser.fullName.trim()) ||
        currentUser.fullName.includes(s.sellerName.trim())
      ))
    );
  }, [sales, currentUser, isAdmin, sellerFilter, users]);

  // فیلتر متنی جستجو در فاکتورها
  const filteredVisibleSales = useMemo(() => {
    if (!invoiceSearchQuery.trim()) return visibleSales;
    const q = invoiceSearchQuery.toLowerCase().trim();
    return visibleSales.filter(s => 
      s.productName.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      getCleanInvoiceCode(s.id).toLowerCase().includes(q) ||
      (s.sellerName && s.sellerName.toLowerCase().includes(q)) ||
      new Date(s.date).toLocaleDateString('fa-IR').includes(q)
    );
  }, [visibleSales, invoiceSearchQuery]);

  // مجموع مبالغ فروش فاکتورهای قابل مشاهده (تومان)
  const totalVisibleAmount = useMemo(() => {
    return visibleSales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [visibleSales]);

  // محاسبه پورسانت برآوردی برای فروشنده جاری
  const salespersonCommissionRate = currentUser?.commissionRate ?? 5;
  const estimatedCommission = useMemo(() => {
    if (isAdmin) return 0;
    return Math.round(totalVisibleAmount * (salespersonCommissionRate / 100));
  }, [totalVisibleAmount, salespersonCommissionRate, isAdmin]);

  // تعداد فاکتورهای بدون انتساب به فروشنده خاص
  const unassignedSalesCount = useMemo(() => {
    return sales.filter(s => !s.sellerName || s.sellerName.includes('مدیر') || s.sellerId === 'admin-id').length;
  }, [sales]);

  // فیلتر هوشمند محصولات بر اساس نام، کد، سایز و رنگ برای ثبت
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

  // محاسبات فرم ثبت جدید
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

  // ثبت فاکتور جدید
  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || isProcessing) return;

    if (selectedProduct.stock < quantity) {
      setNotification({ message: 'موجودی کالای انتخابی کافی نیست!', type: 'error' });
      return;
    }

    setIsProcessing(true);

    const issuerName = currentUser?.fullName || (isAdmin ? 'مدیر ارشد' : 'فروشنده');
    const issuerId = currentUser?.id || (isAdmin ? 'admin-id' : 'salesperson-id');

    // ایجاد شناسه منحصر‌به‌فرد که اطلاعات فروشنده را درون خود کدگذاری می‌کند تا حتی با عدم وجود ستون در پایگاه داده، حفظ شود
    const rawTimestamp = Date.now().toString();
    const encodedSaleId = `${rawTimestamp}__s_${issuerId}__n_${encodeURIComponent(issuerName)}`;

    const newSale: Sale = {
      id: encodedSaleId,
      date: new Date().toISOString(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount: finalTotal,
      profit,
      sellerId: issuerId,
      sellerName: issuerName
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
      setNotification({ 
        message: `فاکتور جدید به شماره ${getCleanInvoiceCode(newSale.id)} برای «${issuerName}» با موفقیت صادر و ثبت شد.`, 
        type: 'success' 
      });

      // برای فروشندگان در حالت نمایش فقط صدور، تب فاکتورها را فعال می‌کنیم تا فاکتور ثبت شده را ببینند
      if (!isAdmin && activeTab === 'form') {
        setActiveTab('invoices');
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: 'خطا در ثبت نهایی فاکتور!', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // انتساب یا تغییر سریع صادرکننده فاکتور توسط مدیر
  const handleAssignSeller = async (sale: Sale, targetUserId: string) => {
    const targetUser = users.find(u => u.id === targetUserId);
    const isManager = !targetUser || targetUserId === 'admin-id' || targetUser.role === 'ADMIN';
    const sellerId = isManager ? 'admin-id' : targetUser.id;
    const sellerName = isManager ? 'مدیر سیستم' : targetUser.fullName;

    const updatedSale: Sale = {
      ...sale,
      sellerId,
      sellerName
    };

    try {
      await DB.setStoredSaleMeta(sale.id, { sellerId, sellerName });
      await DB.updateSale(updatedSale);
      setSales(prev => prev.map(s => s.id === sale.id ? updatedSale : s));
      setNotification({ 
        message: `فاکتور ${getCleanInvoiceCode(sale.id)} به «${sellerName}» منتسب شد و در آمار و پورسانت او اعمال گردید.`, 
        type: 'success' 
      });
    } catch (err) {
      console.error(err);
      setNotification({ message: 'خطا در انتساب فاکتور به فروشنده!', type: 'error' });
    }
  };

  // باز کردن مدال ویرایش
  const handleOpenEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setEditProductId(sale.productId);
    setEditQuantity(sale.quantity);
    
    // محاسبه درصد تخفیف اولیه اگر موجود است
    const origSubtotal = sale.subtotal || 1;
    const calcDiscountPercent = sale.discountAmount ? Math.round((sale.discountAmount / origSubtotal) * 100) : 0;
    setEditDiscountPercent(calcDiscountPercent);

    const afterDiscount = origSubtotal - (sale.discountAmount || 0);
    const calcTaxPercent = (sale.taxAmount && afterDiscount > 0) ? Math.round((sale.taxAmount / afterDiscount) * 100) : 0;
    setEditTaxPercent(calcTaxPercent);

    setEditSellerName(sale.sellerName || (isAdmin ? 'مدیر سیستم' : (currentUser?.fullName || 'فروشنده')));
    setEditSellerId(sale.sellerId || (currentUser?.id || 'admin-id'));
  };

  // محاسبات فرم ویرایش
  const editCurrentProduct = products.find(p => p.id === editProductId);
  const isSameProduct = editingSale?.productId === editProductId;
  const originalQuantity = editingSale?.quantity || 0;
  
  // بررسی موجودی مجاز در ویرایش
  const availableStockForEdit = useMemo(() => {
    if (!editCurrentProduct) return 0;
    if (isSameProduct) {
      return editCurrentProduct.stock + originalQuantity;
    }
    return editCurrentProduct.stock;
  }, [editCurrentProduct, isSameProduct, originalQuantity]);

  const editSubtotal = editCurrentProduct ? editCurrentProduct.sellPrice * editQuantity : 0;
  const editDiscountAmount = Math.round(editSubtotal * (editDiscountPercent / 100));
  const editAmountAfterDiscount = editSubtotal - editDiscountAmount;
  const editTaxAmount = Math.round(editAmountAfterDiscount * (editTaxPercent / 100));
  const editFinalTotal = editAmountAfterDiscount + editTaxAmount;
  const editProfit = editCurrentProduct ? editAmountAfterDiscount - (editCurrentProduct.buyPrice * editQuantity) : 0;

  // ذخیره ویرایش فاکتور
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale || !editCurrentProduct || isSavingEdit) return;

    if (editQuantity > availableStockForEdit) {
      alert(`موجودی کالا کافی نیست! حداکثر موجودی قابل سفارش: ${availableStockForEdit} عدد`);
      return;
    }

    setIsSavingEdit(true);

    try {
      const updatedSale: Sale = {
        ...editingSale,
        productId: editCurrentProduct.id,
        productName: editCurrentProduct.name,
        quantity: editQuantity,
        subtotal: editSubtotal,
        discountAmount: editDiscountAmount,
        taxAmount: editTaxAmount,
        totalAmount: editFinalTotal,
        profit: editProfit,
        sellerId: editSellerId,
        sellerName: editSellerName
      };

      const updatedProductsList: Product[] = [...products];

      if (isSameProduct) {
        const delta = editQuantity - originalQuantity;
        const targetProd = updatedProductsList.find(p => p.id === editCurrentProduct.id);
        if (targetProd) {
          targetProd.stock -= delta;
          await DB.upsertProduct(targetProd);
        }
      } else {
        const oldProd = updatedProductsList.find(p => p.id === editingSale.productId);
        if (oldProd) {
          oldProd.stock += originalQuantity;
          await DB.upsertProduct(oldProd);
        }

        const newProd = updatedProductsList.find(p => p.id === editCurrentProduct.id);
        if (newProd) {
          newProd.stock -= editQuantity;
          await DB.upsertProduct(newProd);
        }
      }

      await DB.updateSale(updatedSale);

      setProducts([...updatedProductsList]);
      setSales(sales.map(s => s.id === updatedSale.id ? updatedSale : s));

      setEditingSale(null);
      setNotification({ message: 'فاکتور با موفقیت ویرایش شد و موجودی انبار بروزرسانی گردید.', type: 'success' });
    } catch (err) {
      console.error(err);
      setNotification({ message: 'خطا در ذخیره ویرایش فاکتور!', type: 'error' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // تایید و حذف فاکتور با بازگردانی ۱۰۰٪ موجودی به انبار
  const handleConfirmDelete = async () => {
    if (!deletingSale || isDeleting) return;

    setIsDeleting(true);
    try {
      const productToRestore = products.find(p => p.id === deletingSale.productId);
      if (productToRestore) {
        const restoredProduct = { ...productToRestore, stock: productToRestore.stock + deletingSale.quantity };
        await Promise.all([
          DB.deleteSale(deletingSale.id),
          DB.upsertProduct(restoredProduct)
        ]);
        setProducts(products.map(p => p.id === deletingSale.productId ? restoredProduct : p));
      } else {
        await DB.deleteSale(deletingSale.id);
      }

      setSales(sales.filter(s => s.id !== deletingSale.id));
      setNotification({ 
        message: `فاکتور ابطال شد و تعداد ${deletingSale.quantity} عدد از کالای «${deletingSale.productName}» به انبار بازگشت.`, 
        type: 'success' 
      });
      setDeletingSale(null);
    } catch (err) {
      console.error(err);
      setNotification({ message: 'خطا در ابطال و حذف فاکتور!', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // رندر برچسب صادرکننده فاکتور و انتخابگر سریع مدیر
  const renderIssuerBadge = (sale: Sale) => {
    const name = sale.sellerName?.trim();
    const isManager = !name || name.includes('مدیر') || sale.sellerId === 'admin-id' || name === 'مدیر ارشد';

    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {name && !isManager ? (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-xl text-xs font-bold shadow-xs">
              <UserIcon size={13} className="text-indigo-600" />
              <span>فروشنده: {name}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-1 rounded-xl text-xs font-bold shadow-xs">
              <ShieldCheck size={13} className="text-amber-600" />
              <span>{name || 'مدیر سیستم'}</span>
            </span>
          )}
        </div>

        {/* برای مدیر امکان تغییر یا انتساب مستقیم سریع صادرکننده وجود دارد */}
        {isAdmin && users.length > 0 && (
          <div className="pt-0.5">
            <select
              value={sale.sellerId || (isManager ? 'admin-id' : '')}
              onChange={e => handleAssignSeller(sale, e.target.value)}
              className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:border-indigo-400 rounded-lg px-2 py-1 outline-none focus:border-indigo-500 cursor-pointer transition-colors max-w-[150px] truncate"
              title="تغییر یا انتساب صادرکننده این فاکتور"
            >
              <option value="admin-id">مدیر سیستم (دفتر مرکزی)</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.role === 'ADMIN' ? 'مدیر: ' : 'فروشنده: '} {u.fullName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* اعلان‌های سیستم */}
      {notification && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-lg border transition-all animate-in fade-in slide-in-from-top-3 duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5 font-bold text-sm">
            {notification.type === 'success' ? <Check size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* بنر سربرگ و سوئیچر تب‌ها */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
            <ShoppingBag size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">
              {isAdmin ? 'مدیریت و صدور فاکتورهای فروش' : 'پنل فروش و فاکتورهای صادر شده'}
            </h1>
            <p className="text-xs text-slate-400 font-bold mt-1">
              {isAdmin 
                ? 'ثبت فاکتور جدید، مشاهده کلیه فاکتورها، ویرایش مبالغ و انتساب به فروشندگان برای حقوق و پورسانت' 
                : `ثبت فاکتور جدید و مشاهده سوابق فاکتورهای صادر شده توسط ${currentUser?.fullName || 'شما'}`}
            </p>
          </div>
        </div>

        {/* دکمه‌های انتخاب حالت نمایش */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('both')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'both'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={14} />
            <span className="hidden sm:inline">میز کار کامل</span>
            <span className="sm:hidden">کامل</span>
          </button>

          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'form'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus size={14} />
            <span>صدور فاکتور</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'invoices'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ReceiptText size={14} />
            <span>
              {isAdmin ? 'لیست کل فاکتورها' : 'فاکتورهای من'} ({visibleSales.length})
            </span>
          </button>
        </div>
      </div>

      {/* بنر راهنما و فیلتر فروشندگان برای مدیر */}
      {isAdmin && (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter size={16} className="text-indigo-600" />
            <span>فیلتر فاکتورها بر اساس فروشنده:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSellerFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                sellerFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              همه ({sales.length})
            </button>

            <button
              onClick={() => setSellerFilter('UNASSIGNED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                sellerFilter === 'UNASSIGNED'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100'
              }`}
            >
              <span>بدون انتساب (مدیر)</span>
              <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[10px]">
                {unassignedSalesCount}
              </span>
            </button>

            {users.map(u => {
              const uSalesCount = sales.filter(s => 
                s.sellerId === u.id || 
                (s.sellerName && s.sellerName.trim() === u.fullName.trim())
              ).length;
              return (
                <button
                  key={u.id}
                  onClick={() => setSellerFilter(u.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    sellerFilter === u.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {u.fullName} ({uSalesCount})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* کارت‌های خلاصه وضعیت برای فروشنده */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400">تعداد فاکتورهای صادر شده شما</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{visibleSales.length} فاکتور</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <FileText size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400">مجموع فروش ثبت شده توسط شما</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">
                {new Intl.NumberFormat('fa-IR').format(totalVisibleAmount)} <span className="text-xs font-bold text-slate-500">تومان</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-400">پورسانت برآوردی شما</p>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-black">
                  {salespersonCommissionRate}٪
                </span>
              </div>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {new Intl.NumberFormat('fa-IR').format(estimatedCommission)} <span className="text-xs font-bold text-slate-500">تومان</span>
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Award size={24} />
            </div>
          </div>
        </div>
      )}

      {/* بخش بدنه اصلی: فرم صدور و جدول فاکتورها */}
      <div className={`grid gap-8 ${activeTab === 'both' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
        
        {/* ۱. فرم صدور فاکتور جدید */}
        {(activeTab === 'both' || activeTab === 'form') && (
          <div className={activeTab === 'both' ? 'lg:col-span-1' : 'max-w-2xl mx-auto w-full'}>
            <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-24 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Plus size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800">صدور فاکتور جدید</h2>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">
                      صادرکننده: <span className="text-indigo-600 font-black">{currentUser?.fullName || (isAdmin ? 'مدیر ارشد' : 'فروشنده')}</span>
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSale} className="space-y-5">
                {/* انتخاب‌گر هوشمند کالا از انبار */}
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                    انتخاب کالا از موجودی انبار
                  </label>

                  {!selectedProduct ? (
                    <div>
                      {/* دکمه بازکننده منو و کادر جستجو */}
                      <div 
                        onClick={() => setIsDropdownOpen(true)}
                        className={`w-full px-4 py-3.5 bg-slate-50 border ${isDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200'} rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:border-slate-300`}
                      >
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs truncate">
                          <Search size={18} className="text-indigo-500 shrink-0" />
                          <span className="truncate">{productSearch ? productSearch : 'جستجوی نام، کد، سایز یا رنگ کالا...'}</span>
                        </div>
                        <ChevronDown size={18} className={`text-slate-400 transition-transform shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
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
                                placeholder="جستجو بر اساس نام، کد، سایز یا رنگ..."
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
                                        {new Intl.NumberFormat('fa-IR').format(p.sellPrice)} تومان
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
                        <span className="font-bold text-slate-500">قیمت واحد فروش:</span>
                        <span className="font-black text-indigo-700 text-sm">
                          {new Intl.NumberFormat('fa-IR').format(selectedProduct.sellPrice)} تومان
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                        <span>موجودی فعلی در انبار:</span>
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
                      <span>{new Intl.NumberFormat('fa-IR').format(subtotal)} تومان</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-xs text-rose-400 font-bold">
                        <span>مبلغ تخفیف ({discountPercent}٪):</span>
                        <span>- {new Intl.NumberFormat('fa-IR').format(discountAmount)} تومان</span>
                      </div>
                    )}
                    {taxAmount > 0 && (
                      <div className="flex justify-between items-center text-xs text-emerald-400 font-bold">
                        <span>مالیات بر ارزش افزوده ({taxPercent}٪):</span>
                        <span>+ {new Intl.NumberFormat('fa-IR').format(taxAmount)} تومان</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-slate-800 pt-3 mt-2">
                      <span className="font-black text-xs text-slate-200">مبلغ نهایی فاکتور:</span>
                      <span className="font-black text-lg text-indigo-400">
                        {new Intl.NumberFormat('fa-IR').format(finalTotal)} تومان
                      </span>
                    </div>
                  </div>
                )}

                <button 
                  disabled={!selectedProduct || isProcessing} 
                  type="submit" 
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20 text-xs flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>در حال ثبت فاکتور و بروزرسانی انبار...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>تایید و صدور نهایی فاکتور</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ۲. جدول مدیریت و سوابق فاکتورهای صادر شده */}
        {(activeTab === 'both' || activeTab === 'invoices') && (
          <div className={activeTab === 'both' ? 'lg:col-span-2' : 'col-span-1'}>
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden space-y-0">
              
              {/* هدر بخش فاکتورها */}
              <div className="p-7 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    {isAdmin ? 'گزارش و مدیریت کلیه فاکتورهای فروش' : 'سوابق و فاکتورهای صادر شده توسط من'}
                  </h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    {isAdmin 
                      ? 'مشاهده، ویرایش مقادیر، انتساب به فروشندگان و ابطال با بازگشت هوشمند موجودی انبار' 
                      : `فهرست فاکتورهای ثبت شده توسط ${currentUser?.fullName || 'شما'} با قابلیت مشاهده، ویرایش و ابطال`}
                  </p>
                </div>

                {/* بج‌های خلاصه فاکتورها */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="bg-indigo-50 text-indigo-700 font-black text-xs px-3.5 py-2 rounded-xl border border-indigo-100/60 flex items-center gap-1.5">
                    <FileText size={14} className="text-indigo-500" />
                    <span>{visibleSales.length} فاکتور</span>
                  </span>

                  <span className="bg-emerald-50 text-emerald-700 font-black text-xs px-3.5 py-2 rounded-xl border border-emerald-100/60 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-emerald-500" />
                    <span>کل کارکرد: {new Intl.NumberFormat('fa-IR').format(totalVisibleAmount)} تومان</span>
                  </span>
                </div>
              </div>

              {/* کادر فیلتر و جستجوی فاکتور */}
              <div className="p-5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="جستجو در فاکتورها (نام کالا، شماره فاکتور، صادرکننده، تاریخ)..."
                    value={invoiceSearchQuery}
                    onChange={e => setInvoiceSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-colors"
                  />
                  {invoiceSearchQuery && (
                    <button 
                      onClick={() => setInvoiceSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="text-xs font-bold text-slate-500 shrink-0">
                  <span>نمایش {filteredVisibleSales.length} از {visibleSales.length} فاکتور</span>
                </div>
              </div>

              {/* جدول داده‌های فاکتورها */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs uppercase font-black border-b border-slate-100">
                      <th className="px-6 py-4">کد فاکتور / تاریخ</th>
                      <th className="px-6 py-4">عنوان محصول</th>
                      <th className="px-6 py-4 text-center">تعداد</th>
                      <th className="px-6 py-4">صادرکننده فاکتور</th>
                      <th className="px-6 py-4 font-black">مبلغ نهایی</th>
                      <th className="px-6 py-4 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredVisibleSales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-slate-400 font-bold text-xs space-y-2">
                          <ReceiptText size={40} className="mx-auto opacity-25" />
                          <p>
                            {visibleSales.length === 0 
                              ? (isAdmin ? 'هیچ فاکتوری با این فیلتر در سیستم ثبت نشده است.' : 'شما هنوز هیچ فاکتوری صادر نکرده‌اید یا فاکتوری ثبت نشده است.')
                              : 'هیچ فاکتوری با عبارت جستجوی وارد شده یافت نشد.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredVisibleSales.map(sale => (
                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                          {/* کد فاکتور و تاریخ */}
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-black text-indigo-600 block">
                              {getCleanInvoiceCode(sale.id)}
                            </span>
                            <span className="text-[11px] text-slate-400 font-bold block mt-0.5">
                              {new Date(sale.date).toLocaleDateString('fa-IR')}
                            </span>
                          </td>

                          {/* عنوان محصول */}
                          <td className="px-6 py-4 font-black text-slate-800">
                            <span>{sale.productName}</span>
                          </td>

                          {/* تعداد */}
                          <td className="px-6 py-4 text-center font-black text-slate-700">
                            <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200/60">
                              {sale.quantity} عدد
                            </span>
                          </td>

                          {/* فرد صادرکننده فاکتور */}
                          <td className="px-6 py-4">
                            {renderIssuerBadge(sale)}
                          </td>

                          {/* مبلغ نهایی فاکتور */}
                          <td className="px-6 py-4 font-black text-indigo-600 text-base">
                            {new Intl.NumberFormat('fa-IR').format(sale.totalAmount)} <span className="text-xs font-bold text-slate-500">تومان</span>
                          </td>

                          {/* دکمه‌های عملیات: مشاهده، ویرایش، حذف */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* مشاهده فاکتور چاپی */}
                              <button 
                                onClick={() => setViewingInvoice(sale)} 
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="مشاهده و چاپ فاکتور"
                              >
                                <Eye size={16} />
                              </button>

                              {/* ویرایش فاکتور */}
                              <button 
                                onClick={() => handleOpenEditModal(sale)} 
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                title="ویرایش فاکتور"
                              >
                                <Edit3 size={16} />
                              </button>

                              {/* حذف فاکتور با بازگشت موجودی */}
                              <button 
                                onClick={() => setDeletingSale(sale)} 
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                title="ابطال فاکتور و بازگشت به انبار"
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
        )}
      </div>

      {/* مدال ویرایش فاکتور (Edit Invoice Modal) */}
      {editingSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-7 space-y-6 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Edit3 size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">ویرایش فاکتور فروش</h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">
                    کد رهگیری فاکتور: {getCleanInvoiceCode(editingSale.id)} - تاریخ صدور: {new Date(editingSale.date).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingSale(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              {/* انتخاب محصول */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  کالای فاکتور
                </label>
                <select
                  value={editProductId}
                  onChange={e => {
                    setEditProductId(e.target.value);
                    setEditQuantity(1);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) - سایز: {p.size || '-'} | رنگ: {p.color || '-'} - موجودی فعلی: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              {/* تعداد سفارش */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600">
                    تعداد سفارش
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    حداکثر موجودی قابل تنظیم: {availableStockForEdit} عدد
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                  <button 
                    type="button" 
                    onClick={() => setEditQuantity(prev => Math.min(availableStockForEdit, prev + 1))}
                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black"
                  >
                    <Plus size={16} />
                  </button>
                  <input 
                    type="number" 
                    min="1" 
                    max={availableStockForEdit}
                    value={editQuantity}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      setEditQuantity(Math.max(1, Math.min(availableStockForEdit, val)));
                    }}
                    className="w-full text-center bg-transparent font-black text-lg text-slate-800 outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={() => setEditQuantity(prev => Math.max(1, prev - 1))}
                    className="p-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all font-black"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              </div>

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
                    value={editDiscountPercent} 
                    onChange={e => setEditDiscountPercent(Number(e.target.value))} 
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
                    value={editTaxPercent} 
                    onChange={e => setEditTaxPercent(Number(e.target.value))} 
                  />
                </div>
              </div>

              {/* تعیین صادرکننده فاکتور (در صورت مدیر بودن) */}
              {isAdmin && users.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    تغییر یا انتساب صادرکننده فاکتور
                  </label>
                  <select
                    value={editSellerId || (editSellerName === 'مدیر ارشد' || editSellerName === 'مدیر سیستم' ? 'admin-id' : '')}
                    onChange={e => {
                      const selectedUser = users.find(u => u.id === e.target.value);
                      if (selectedUser) {
                        setEditSellerName(selectedUser.fullName);
                        setEditSellerId(selectedUser.id);
                      } else {
                        setEditSellerName('مدیر سیستم');
                        setEditSellerId('admin-id');
                      }
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500"
                  >
                    <option value="admin-id">مدیر سیستم (دفتر مرکزی)</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.role === 'ADMIN' ? 'مدیر: ' : 'فروشنده: '} {u.fullName} ({u.username})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* پیش‌نمایش تاثیر ویرایش بر انبار */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
                <div className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Package size={14} className="text-indigo-600" />
                  <span>تأثیر ویرایش بر موجودی انبار:</span>
                </div>
                {isSameProduct ? (
                  editQuantity === originalQuantity ? (
                    <p className="text-slate-500">تعداد کالا تغییری نکرده است؛ موجودی انبار دست‌نخورده باقی می‌ماند.</p>
                  ) : editQuantity > originalQuantity ? (
                    <p className="text-rose-600 font-bold">
                      تعداد {editQuantity - originalQuantity} عدد دیگر از موجودی انبار کسر خواهد شد (موجودی پس از ثبت: {editCurrentProduct?.stock ? editCurrentProduct.stock - (editQuantity - originalQuantity) : 0} عدد).
                    </p>
                  ) : (
                    <p className="text-emerald-600 font-bold">
                      تعداد {originalQuantity - editQuantity} عدد به موجودی انبار بازگردانده خواهد شد (موجودی پس از ثبت: {editCurrentProduct?.stock ? editCurrentProduct.stock + (originalQuantity - editQuantity) : 0} عدد).
                    </p>
                  )
                ) : (
                  <p className="text-amber-700 font-bold">
                    تعداد {originalQuantity} عدد به کالای قبلی برگردانده شده و {editQuantity} عدد از کالای جدید کسر خواهد شد.
                  </p>
                )}
              </div>

              {/* خلاصه مبالغ ویرایش‌شده */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>جمع کل کالایی:</span>
                  <span>{new Intl.NumberFormat('fa-IR').format(editSubtotal)} تومان</span>
                </div>
                {editDiscountAmount > 0 && (
                  <div className="flex justify-between items-center text-rose-400">
                    <span>مبلغ تخفیف:</span>
                    <span>- {new Intl.NumberFormat('fa-IR').format(editDiscountAmount)} تومان</span>
                  </div>
                )}
                {editTaxAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-400">
                    <span>مالیات بر ارزش افزوده:</span>
                    <span>+ {new Intl.NumberFormat('fa-IR').format(editTaxAmount)} تومان</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-800 pt-3 font-black text-sm">
                  <span className="text-slate-200">مبلغ نهایی جدید:</span>
                  <span className="text-indigo-400 text-base">
                    {new Intl.NumberFormat('fa-IR').format(editFinalTotal)} تومان
                  </span>
                </div>
              </div>

              {/* دکمه‌های عملیات */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>در حال ذخیره...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>ذخیره تغییرات فاکتور</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال تایید حذف فاکتور و بازگشت ۱۰۰٪ به انبار */}
      {deletingSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={28} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-800">ابطال و حذف فاکتور فروش</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-bold">
                آیا از ابطال فاکتور شماره <span className="font-mono text-slate-800 font-black">{getCleanInvoiceCode(deletingSale.id)}</span> اطمینان دارید؟
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-800 space-y-1">
              <div className="font-black flex items-center gap-1.5 text-emerald-900">
                <Check size={16} />
                <span>بازگشت خودکار به موجودی انبار:</span>
              </div>
              <p className="leading-relaxed">
                تعداد <strong className="font-black">{deletingSale.quantity} عدد</strong> از کالای «{deletingSale.productName}» بلافاصله به موجودی انبار برگشت داده می‌شود و موجودی کالا دست‌نخورده خواهد ماند.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSale(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>در حال ابطال...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>تایید ابطال و بازگشت به انبار</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مدال پیش‌نمایش و چاپ فاکتور (Invoice Preview & Print) */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* سربرگ فاکتور رسمی */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                  SS
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">فاکتور رسمی فروش Smart Shop</h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">سامانه هوشمند انبارداری و ثبت فاکتور</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingInvoice(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* مشخصات عمومی فاکتور */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block font-bold">شماره فاکتور:</span>
                <span className="font-black text-slate-800 font-mono text-sm mt-0.5 block">{getCleanInvoiceCode(viewingInvoice.id)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">تاریخ و زمان صدور:</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{new Date(viewingInvoice.date).toLocaleDateString('fa-IR')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">فروشنده / صادرکننده:</span>
                <span className="font-black text-indigo-700 mt-0.5 block">{viewingInvoice.sellerName || 'مدیر سیستم'}</span>
              </div>
            </div>

            {/* جدول اقلام فاکتور */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-600 font-black">
                  <tr>
                    <th className="p-3">ردیف</th>
                    <th className="p-3">شرح کالا</th>
                    <th className="p-3 text-center">تعداد</th>
                    <th className="p-3 text-left">مبلغ کل (تومان)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-bold text-slate-400">۱</td>
                    <td className="p-3 font-black text-slate-800">{viewingInvoice.productName}</td>
                    <td className="p-3 text-center font-bold text-slate-700">{viewingInvoice.quantity} عدد</td>
                    <td className="p-3 text-left font-black text-slate-800">
                      {new Intl.NumberFormat('fa-IR').format(viewingInvoice.subtotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* خلاصه محاسبات فاکتور */}
            <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs font-bold">
              <div className="flex justify-between items-center text-slate-600">
                <span>جمع کل اقلام:</span>
                <span>{new Intl.NumberFormat('fa-IR').format(viewingInvoice.subtotal)} تومان</span>
              </div>
              {viewingInvoice.discountAmount > 0 && (
                <div className="flex justify-between items-center text-rose-600">
                  <span>تخفیف اعمال شده:</span>
                  <span>- {new Intl.NumberFormat('fa-IR').format(viewingInvoice.discountAmount)} تومان</span>
                </div>
              )}
              {viewingInvoice.taxAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-600">
                  <span>مالیات بر ارزش افزوده:</span>
                  <span>+ {new Intl.NumberFormat('fa-IR').format(viewingInvoice.taxAmount)} تومان</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-slate-200 pt-3 text-sm font-black text-slate-900">
                <span>مبلغ نهایی قابل پرداخت:</span>
                <span className="text-indigo-600 text-base">
                  {new Intl.NumberFormat('fa-IR').format(viewingInvoice.totalAmount)} تومان
                </span>
              </div>
            </div>

            {/* دکمه چاپ و بستن */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setViewingInvoice(null)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs transition-colors"
              >
                بستن
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Printer size={16} />
                <span>چاپ فاکتور</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesManager;
