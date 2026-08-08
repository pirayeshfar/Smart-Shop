import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  AlertCircle, 
  ShoppingCart, 
  Users, 
  Award, 
  Percent, 
  ReceiptText, 
  UserCheck, 
  Search, 
  X, 
  FileText, 
  Printer, 
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { Product, Sale, Expense, User } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface Props {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  users: User[];
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price) + ' ریال';
};

const Dashboard: React.FC<Props> = ({ products, sales, expenses, users }) => {
  // درصد پورسانت همگانی پیش‌فرض
  const [globalRateInput, setGlobalRateInput] = useState<number>(5);
  // درصد پورسانت سفارشی به ازای هر کاربر
  const [commissionRates, setCommissionRates] = useState<Record<string, number>>({});
  // جستجو در لیست فروشندگان
  const [searchTerm, setSearchTerm] = useState('');
  // فیلتر نقش کاربر
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SALESPERSON' | 'ADMIN'>('ALL');
  // کاربر انتخاب شده برای مشاهده جزئیات فاکتورها
  const [selectedUserInvoices, setSelectedUserInvoices] = useState<User | null>(null);

  const stats = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalProfit - totalExpenses;
    const lowStockCount = products.filter(p => p.stock <= p.reorderPoint).length;

    return { totalSales, netProfit, totalExpenses, lowStockCount };
  }, [products, sales, expenses]);

  const lowStockItems = products.filter(p => p.stock <= p.reorderPoint);

  // اعمال یک درصد پورسانت همگانی روی همه کاربران
  const handleApplyGlobalRate = () => {
    const validRate = Math.max(0, Math.min(100, globalRateInput));
    const newRates: Record<string, number> = {};
    users.forEach(u => {
      newRates[u.id] = validRate;
    });
    setCommissionRates(newRates);
  };

  // محاسبه آمار هر فروشنده
  const sellersData = useMemo(() => {
    return users.map(user => {
      // جستجوی فاکتورهای مربوط به این کاربر بر اساس شناسه یا نام
      const userSales = sales.filter(s => 
        (s.sellerId && s.sellerId === user.id) || 
        (s.sellerName && (s.sellerName === user.fullName || s.sellerName === user.username))
      );

      const salesCount = userSales.length;
      const totalAmount = userSales.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalProfit = userSales.reduce((sum, s) => sum + s.profit, 0);
      // درصد پورسانت اولویت: تغییر دستی زنده > پورسانت پروفایل کاربر > ۵٪
      const rate = commissionRates[user.id] ?? user.commissionRate ?? 5;
      const commissionAmount = Math.round(totalAmount * (rate / 100));
      const sharePercentage = stats.totalSales > 0 ? (totalAmount / stats.totalSales) * 100 : 0;

      return {
        user,
        salesCount,
        totalAmount,
        totalProfit,
        rate,
        commissionAmount,
        sharePercentage,
        userSales
      };
    });
  }, [users, sales, commissionRates, stats.totalSales]);

  // فروشندگان فیلتر شده بر اساس جستجو و نقش
  const filteredSellers = useMemo(() => {
    return sellersData.filter(item => {
      const matchesSearch = item.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || item.user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [sellersData, searchTerm, roleFilter]);

  // مجموع پورسانت کلیه فروشندگان
  const totalCommissionToPay = useMemo(() => {
    return sellersData.reduce((sum, item) => sum + item.commissionAmount, 0);
  }, [sellersData]);

  // تغییر درصد پورسانت یک فروشنده
  const handleRateChange = (userId: string, newRate: number) => {
    const validRate = Math.max(0, Math.min(100, newRate));
    setCommissionRates(prev => ({ ...prev, [userId]: validRate }));
  };

  // اطلاعات فاکتورهای کاربر انتخابی برای مودال
  const selectedSellerDetail = useMemo(() => {
    if (!selectedUserInvoices) return null;
    return sellersData.find(item => item.user.id === selectedUserInvoices.id) || null;
  }, [selectedUserInvoices, sellersData]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stat Cards اصلی */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="کل فروش" 
          value={formatPrice(stats.totalSales)} 
          icon={<ShoppingCart className="text-emerald-600" />}
          bgColor="bg-emerald-50"
          trend="+۱۲٪ این ماه"
        />
        <StatCard 
          title="سود خالص" 
          value={formatPrice(stats.netProfit)} 
          icon={<DollarSign className="text-indigo-600" />}
          bgColor="bg-indigo-50"
          trend="+۵٪ از دیروز"
        />
        <StatCard 
          title="هزینه‌ها" 
          value={formatPrice(stats.totalExpenses)} 
          icon={<TrendingDown className="text-rose-600" />}
          bgColor="bg-rose-50"
        />
        <StatCard 
          title="وضعیت انبار" 
          value={stats.lowStockCount.toString() + ' کالا کمبود'} 
          icon={<AlertCircle className="text-amber-600" />}
          bgColor="bg-amber-50"
          highlight={stats.lowStockCount > 0}
        />
      </div>

      {/* نمودار فروش و هشدار انبار */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800">تحلیل روند فروش</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                <TrendingUp size={12} />
                رشد مثبت
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales.slice(-10)}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    textAlign: 'right', 
                    direction: 'rtl', 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '16px'
                  }}
                  itemStyle={{ fontWeight: '900', color: '#4f46e5' }}
                  formatter={(value: any) => [formatPrice(value), 'مبلغ']}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalAmount" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  strokeWidth={4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <Package size={20} className="text-indigo-600" />
            هشدار موجودی انبار
          </h3>
          <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                <Package size={64} className="mb-4 opacity-10" />
                <p className="text-sm font-black">انبار کاملاً شارژ است</p>
              </div>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="group flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-300 transition-all hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-400 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-100 group-hover:border-indigo-100">{item.code}</span>
                      <p className="text-sm font-black text-slate-800">{item.name}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 font-bold">سایز: {item.size} | رنگ: {item.color}</p>
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                      {item.stock} عدد
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* بخش جدید: مدیریت عملکرد و محاسبه پورسانت فروشندگان */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Award size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">وضعیت فروش و پورسانت فروشندگان</h2>
                <p className="text-slate-400 text-xs font-bold mt-1">
                  مشاهده کارکرد فروشندگان ثبت شده در مدیریت سیستم و تعیین پورسانت پرداختی
                </p>
              </div>
            </div>
          </div>

          {/* ابزارهای جستجو، فیلتر و پورسانت همگانی */}
          <div className="flex flex-wrap items-center gap-3">
            {/* تنظیم پورسانت همگانی */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl text-xs font-bold">
              <span className="text-slate-500 pr-2">پورسانت همگانی:</span>
              <input 
                type="number" 
                min="0" 
                max="100" 
                step="0.5"
                value={globalRateInput}
                onChange={e => setGlobalRateInput(parseFloat(e.target.value) || 0)}
                className="w-12 text-center bg-white border border-slate-200 rounded-lg py-1 font-black text-xs text-indigo-600 outline-none"
              />
              <span className="text-slate-400">٪</span>
              <button 
                onClick={handleApplyGlobalRate}
                className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg hover:bg-indigo-700 transition-colors text-[11px] font-black"
                title="اعمال برای همه"
              >
                اعمال یکجا
              </button>
            </div>

            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="جستجوی نام فروشنده..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-40 md:w-52"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button 
                onClick={() => setRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${roleFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                همه ({users.length})
              </button>
              <button 
                onClick={() => setRoleFilter('SALESPERSON')}
                className={`px-3 py-1.5 rounded-lg transition-all ${roleFilter === 'SALESPERSON' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                فروشندگان ({users.filter(u => u.role === 'SALESPERSON').length})
              </button>
            </div>
          </div>
        </div>

        {/* خلاصه کارت‌های پورسانت فروشندگان */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold opacity-80">مجموع پورسانت‌های محاسبه‌شده</span>
              <Percent size={18} className="opacity-80" />
            </div>
            <p className="text-2xl font-black">{formatPrice(totalCommissionToPay)}</p>
            <p className="text-[10px] mt-2 opacity-70">بر اساس درصد تعیین‌شده برای هر فروشنده</p>
          </div>

          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700">فروشندگان دارای فروش</span>
              <UserCheck size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-900">
              {sellersData.filter(s => s.salesCount > 0).length} از {users.length} نفر
            </p>
            <p className="text-[10px] text-emerald-600 font-bold mt-2">ثبت‌نام شده در مدیریت سیستم</p>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600">میانگین پورسانت هر فروشنده</span>
              <Sparkles size={18} className="text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-800">
              {formatPrice(
                sellersData.filter(s => s.salesCount > 0).length > 0 
                  ? Math.round(totalCommissionToPay / sellersData.filter(s => s.salesCount > 0).length) 
                  : 0
              )}
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-2">میانگین پرداختی پورسانت</p>
          </div>
        </div>

        {/* جدول اصلی فروشندگان و تعیین پورسانت */}
        {filteredSellers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Users size={48} className="mx-auto opacity-20" />
            <p className="font-bold text-sm">هیچ فروشنده‌ای با این مشخصات یافت نشد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-black uppercase">
                  <th className="py-4 px-4">فروشنده</th>
                  <th className="py-4 px-4 text-center">تعداد فاکتور</th>
                  <th className="py-4 px-4">مجموع فروش</th>
                  <th className="py-4 px-4">سود حاصله</th>
                  <th className="py-4 px-4 text-center">درصد پورسانت (%)</th>
                  <th className="py-4 px-4">مبلغ پورسانت</th>
                  <th className="py-4 px-4 text-center">سهم از کل فروش</th>
                  <th className="py-4 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredSellers.map(({ user, salesCount, totalAmount, totalProfit, rate, commissionAmount, sharePercentage }) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* نام و نقش */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                          user.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{user.fullName}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            user.role === 'ADMIN' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            {user.role === 'ADMIN' ? 'مدیر ارشد' : 'فروشنده'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* تعداد فاکتور */}
                    <td className="py-4 px-4 text-center font-black text-slate-700">
                      <span className={`px-3 py-1 rounded-xl text-xs ${salesCount > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        {salesCount} فاکتور
                      </span>
                    </td>

                    {/* مجموع فروش */}
                    <td className="py-4 px-4 font-black text-slate-900">
                      {formatPrice(totalAmount)}
                    </td>

                    {/* سود حاصله */}
                    <td className="py-4 px-4 font-bold text-emerald-600">
                      {formatPrice(totalProfit)}
                    </td>

                    {/* تغییر درصد پورسانت */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <input 
                          type="number" 
                          min="0" 
                          max="100"
                          step="0.5"
                          value={rate}
                          onChange={e => handleRateChange(user.id, parseFloat(e.target.value) || 0)}
                          className="w-14 text-center bg-white border border-slate-200 rounded-lg py-1 font-black text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-slate-500 font-bold text-xs pl-1">٪</span>
                      </div>
                    </td>

                    {/* مبلغ پورسانت */}
                    <td className="py-4 px-4 font-black text-indigo-600 text-base">
                      {formatPrice(commissionAmount)}
                    </td>

                    {/* نوار سهم فروش */}
                    <td className="py-4 px-4">
                      <div className="w-32 mx-auto space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>سهم:</span>
                          <span>{sharePercentage.toFixed(1)}٪</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, sharePercentage)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* دکمه مشاهده فاکتورها */}
                    <td className="py-4 px-4 text-center">
                      <button 
                        onClick={() => setSelectedUserInvoices(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 text-xs font-bold rounded-xl transition-all shadow-sm"
                      >
                        <ReceiptText size={14} />
                        <span>جزئیات فاکتورها</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* مودال جزئیات فاکتورها و تسویه‌حساب پورسانت فروشنده */}
      {/* ========================================================================= */}
      {selectedSellerDetail && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden p-8 space-y-6 max-h-[90vh] flex flex-col">
            {/* سربرگ مودال */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-lg">
                  {selectedSellerDetail.user.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    صورت کارکرد و پورسانت: {selectedSellerDetail.user.fullName}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">
                    نام کاربری: {selectedSellerDetail.user.username} | نقش: {selectedSellerDetail.user.role === 'ADMIN' ? 'مدیر سیستم' : 'فروشنده'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUserInvoices(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* کارت‌های خلاصه تسویه‌حساب */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 block mb-1">مجموع فروش ثبت‌شده</span>
                <span className="text-lg font-black text-slate-800">{formatPrice(selectedSellerDetail.totalAmount)}</span>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <span className="text-xs font-bold text-indigo-500 block mb-1">درصد پورسانت مصوب</span>
                <span className="text-lg font-black text-indigo-700">{selectedSellerDetail.rate} درصد</span>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <span className="text-xs font-bold text-emerald-600 block mb-1">خالص پورسانت قابل پرداخت</span>
                <span className="text-lg font-black text-emerald-700">{formatPrice(selectedSellerDetail.commissionAmount)}</span>
              </div>
            </div>

            {/* لیست فاکتورهای صادر شده توسط این فروشنده */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                فاکتورهای ثبت شده ({selectedSellerDetail.userSales.length} مورد)
              </h4>

              {selectedSellerDetail.userSales.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <FileText size={40} className="mx-auto opacity-20" />
                  <p className="text-xs font-bold">هنوز فاکتوری توسط این فروشنده به ثبت نرسیده است.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSellerDetail.userSales.map(sale => (
                    <div key={sale.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 text-sm">{sale.productName}</span>
                          <span className="text-[10px] bg-white px-2 py-0.5 rounded border text-slate-500 font-bold">
                            تعداد: {sale.quantity}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold block mt-1">
                          تاریخ: {new Date(sale.date).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="font-black text-indigo-600 text-sm block">
                          {formatPrice(sale.totalAmount)}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold">
                          سود: {formatPrice(sale.profit)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* پانویس و دکمه چاپ */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">
                محاسبه شده بر اساس الگوریتم هوشمند فروشگاه
              </span>
              <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/10"
              >
                <Printer size={16} />
                <span>چاپ فیش پورسانت</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  highlight?: boolean;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, bgColor, highlight, trend }) => (
  <div className={`p-7 rounded-[2.5rem] shadow-sm border border-slate-100 bg-white transition-all hover:shadow-xl hover:translate-y-[-4px] ${highlight ? 'ring-2 ring-amber-400' : ''}`}>
    <div className="flex items-center justify-between mb-5">
      <div className={`p-4 rounded-2xl ${bgColor}`}>
        {icon}
      </div>
      {trend && (
        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <h4 className="text-slate-500 text-xs font-bold mb-2 uppercase tracking-widest">{title}</h4>
    <p className="text-2xl font-black text-slate-900 leading-tight truncate">{value}</p>
  </div>
);

export default Dashboard;
