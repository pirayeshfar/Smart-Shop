import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  ShoppingCart, 
  Wallet, 
  Award, 
  Printer, 
  Download, 
  Filter, 
  CheckCircle2, 
  Package, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  PieChart as PieIcon,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Product, Sale, Expense, User } from '../types';
import {
  PERSIAN_MONTHS,
  toPersianDigits,
  getJalaliFromDate,
  getJalaliMonthLength,
  getJalaliMonthRange,
  shiftJalaliMonth,
  toJalaliMonthKey,
  parseJalaliMonthKey,
  formatJalaliMonthLabel,
} from '../utils/persianDate';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';

interface Props {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  users: User[];
}

type PeriodType = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(Math.round(price)) + ' تومان';
};

const getLocalDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const matchesSeller = (sale: Sale, sellerId: string, usersList: User[]): boolean => {
  if (sellerId === 'ALL') return true;
  const selectedUser = usersList.find(u => u.id === sellerId);
  return (
    Boolean(sale.sellerId && sale.sellerId === sellerId) ||
    Boolean(
      sale.sellerName &&
        selectedUser &&
        (sale.sellerName.trim() === selectedUser.fullName.trim() ||
          sale.sellerName.includes(selectedUser.fullName.trim()) ||
          selectedUser.fullName.includes(sale.sellerName.trim()))
    )
  );
};

const ReportsManager: React.FC<Props> = ({ products, sales, expenses, users }) => {
  const currentJalali = useMemo(() => getJalaliFromDate(new Date()), []);
  const currentMonthKey = useMemo(
    () => toJalaliMonthKey(currentJalali.jy, currentJalali.jm),
    [currentJalali]
  );

  const [period, setPeriod] = useState<PeriodType>('MONTHLY');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);
  const [selectedSellerId, setSelectedSellerId] = useState<string>('ALL');

  // ساخت لیست ماه‌های شمسی قابل انتخاب (ماه جاری + ۱۱ ماه قبل + تمام ماه‌های دارای سند ثبت‌شده)
  const availableMonthOptions = useMemo(() => {
    const keys = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const m = shiftJalaliMonth(currentJalali.jy, currentJalali.jm, -i);
      keys.add(toJalaliMonthKey(m.jy, m.jm));
    }

    sales.forEach(s => {
      const d = new Date(s.date);
      if (!Number.isNaN(d.getTime())) {
        const j = getJalaliFromDate(d);
        keys.add(toJalaliMonthKey(j.jy, j.jm));
      }
    });

    expenses.forEach(e => {
      const d = new Date(e.date);
      if (!Number.isNaN(d.getTime())) {
        const j = getJalaliFromDate(d);
        keys.add(toJalaliMonthKey(j.jy, j.jm));
      }
    });

    const sortedKeys = Array.from(keys).sort((a, b) => b.localeCompare(a));
    const options = sortedKeys.map(key => {
      const parsed = parseJalaliMonthKey(key);
      const baseLabel = parsed ? formatJalaliMonthLabel(parsed.jy, parsed.jm) : key;
      return {
        key,
        label: key === currentMonthKey ? `${baseLabel} (ماه جاری)` : baseLabel,
      };
    });

    options.push({
      key: 'ROLLING_30',
      label: '۳۰ روز اخیر (بازه چرخشی)',
    });

    return options;
  }, [sales, expenses, currentJalali, currentMonthKey]);

  const calendarMonthKeys = useMemo(
    () => availableMonthOptions.filter(o => o.key !== 'ROLLING_30').map(o => o.key),
    [availableMonthOptions]
  );
  const currentMonthNavIdx = calendarMonthKeys.indexOf(selectedMonthKey);
  const canGoPrevMonth =
    selectedMonthKey === 'ROLLING_30'
      ? calendarMonthKeys.length > 0
      : currentMonthNavIdx !== -1 && currentMonthNavIdx < calendarMonthKeys.length - 1;
  const canGoNextMonth = selectedMonthKey !== 'ROLLING_30' && currentMonthNavIdx > 0;

  const handlePrevMonth = () => {
    if (selectedMonthKey === 'ROLLING_30') {
      if (calendarMonthKeys.length > 0) setSelectedMonthKey(calendarMonthKeys[0]);
      return;
    }
    if (canGoPrevMonth) {
      setSelectedMonthKey(calendarMonthKeys[currentMonthNavIdx + 1]);
    }
  };

  const handleNextMonth = () => {
    if (canGoNextMonth) {
      setSelectedMonthKey(calendarMonthKeys[currentMonthNavIdx - 1]);
    }
  };

  // محاسبه محدوده زمانی دقیق بر اساس دوره و ماه شمسی انتخاب‌شده
  const {
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
    periodLabel,
    periodBadge,
    selectedJalaliMonth,
  } = useMemo(() => {
    const today = new Date();
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    if (period === 'WEEKLY') {
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6, 0, 0, 0, 0);
      const prevEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7, 23, 59, 59, 999);
      const prevStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13, 0, 0, 0, 0);
      return {
        startDate: start,
        endDate: endOfToday,
        prevStartDate: prevStart,
        prevEndDate: prevEnd,
        periodLabel: 'گزارش هفتگی (۷ روز اخیر)',
        periodBadge: 'دوره‌ای: ۷ روز اخیر',
        selectedJalaliMonth: null as { jy: number; jm: number } | null,
      };
    }

    if (period === 'MONTHLY') {
      if (selectedMonthKey === 'ROLLING_30') {
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29, 0, 0, 0, 0);
        const prevEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30, 23, 59, 59, 999);
        const prevStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 59, 0, 0, 0, 0);
        return {
          startDate: start,
          endDate: endOfToday,
          prevStartDate: prevStart,
          prevEndDate: prevEnd,
          periodLabel: '۳۰ روز اخیر (بازه چرخشی)',
          periodBadge: 'دوره‌ای: ۳۰ روز اخیر',
          selectedJalaliMonth: null as { jy: number; jm: number } | null,
        };
      }

      const parsed = parseJalaliMonthKey(selectedMonthKey) || {
        jy: currentJalali.jy,
        jm: currentJalali.jm,
      };
      const { startDate: mStart, endDate: mEnd } = getJalaliMonthRange(parsed.jy, parsed.jm);
      const prevYm = shiftJalaliMonth(parsed.jy, parsed.jm, -1);
      const { startDate: pStart, endDate: pEnd } = getJalaliMonthRange(prevYm.jy, prevYm.jm);
      const monthTitle = formatJalaliMonthLabel(parsed.jy, parsed.jm);
      const isCurrent = toJalaliMonthKey(parsed.jy, parsed.jm) === currentMonthKey;

      return {
        startDate: mStart,
        endDate: mEnd,
        prevStartDate: pStart,
        prevEndDate: pEnd,
        periodLabel: `${monthTitle}${isCurrent ? ' (ماه جاری)' : ''}`,
        periodBadge: `ماه شمسی: ${monthTitle}`,
        selectedJalaliMonth: parsed,
      };
    }

    // سالانه: ۱۲ ماه اخیر شمسی
    const oldest = shiftJalaliMonth(currentJalali.jy, currentJalali.jm, -11);
    const { startDate: yStart } = getJalaliMonthRange(oldest.jy, oldest.jm);
    const { endDate: yEnd } = getJalaliMonthRange(currentJalali.jy, currentJalali.jm);
    const prevOldest = shiftJalaliMonth(currentJalali.jy, currentJalali.jm, -23);
    const prevNewest = shiftJalaliMonth(currentJalali.jy, currentJalali.jm, -12);
    const { startDate: pyStart } = getJalaliMonthRange(prevOldest.jy, prevOldest.jm);
    const { endDate: pyEnd } = getJalaliMonthRange(prevNewest.jy, prevNewest.jm);

    return {
      startDate: yStart,
      endDate: yEnd,
      prevStartDate: pyStart,
      prevEndDate: pyEnd,
      periodLabel: 'گزارش سالانه (۱۲ ماه اخیر شمسی)',
      periodBadge: 'دوره‌ای: ۱۲ ماه شمسی',
      selectedJalaliMonth: null as { jy: number; jm: number } | null,
    };
  }, [period, selectedMonthKey, currentJalali, currentMonthKey]);

  // تمام فروش‌های بازه انتخاب‌شده (بدون فیلتر فروشنده؛ جهت محاسبه سهم واقعی تیم در دوره)
  const periodSales = useMemo(() => {
    return sales.filter(s => {
      const sDate = new Date(s.date);
      return !Number.isNaN(sDate.getTime()) && sDate >= startDate && sDate <= endDate;
    });
  }, [sales, startDate, endDate]);

  // فروش‌های بازه انتخاب‌شده بر اساس فروشنده انتخابی
  const currentSales = useMemo(() => {
    if (selectedSellerId === 'ALL') return periodSales;
    return periodSales.filter(s => matchesSeller(s, selectedSellerId, users));
  }, [periodSales, selectedSellerId, users]);

  // فروش‌های دوره قبل برای مقایسه درصد رشد
  const previousSales = useMemo(() => {
    return sales.filter(s => {
      const sDate = new Date(s.date);
      const inDateRange = !Number.isNaN(sDate.getTime()) && sDate >= prevStartDate && sDate <= prevEndDate;
      if (!inDateRange) return false;
      return matchesSeller(s, selectedSellerId, users);
    });
  }, [sales, prevStartDate, prevEndDate, selectedSellerId, users]);

  // هزینه‌های دوره جاری
  const currentExpenses = useMemo(() => {
    return expenses.filter(e => {
      const eDate = new Date(e.date);
      return !Number.isNaN(eDate.getTime()) && eDate >= startDate && eDate <= endDate;
    });
  }, [expenses, startDate, endDate]);

  // هزینه‌های دوره قبلی
  const previousExpenses = useMemo(() => {
    return expenses.filter(e => {
      const eDate = new Date(e.date);
      return !Number.isNaN(eDate.getTime()) && eDate >= prevStartDate && eDate <= prevEndDate;
    });
  }, [expenses, prevStartDate, prevEndDate]);

  // شاخص‌های کلیدی عملکرد (KPIs)
  const periodRevenue = useMemo(() => periodSales.reduce((acc, s) => acc + s.totalAmount, 0), [periodSales]);
  const currentRevenue = useMemo(() => currentSales.reduce((acc, s) => acc + s.totalAmount, 0), [currentSales]);
  const prevRevenue = useMemo(() => previousSales.reduce((acc, s) => acc + s.totalAmount, 0), [previousSales]);

  const currentGrossProfit = useMemo(() => currentSales.reduce((acc, s) => acc + s.profit, 0), [currentSales]);
  const prevGrossProfit = useMemo(() => previousSales.reduce((acc, s) => acc + s.profit, 0), [previousSales]);

  const currentExpenseTotal = useMemo(() => currentExpenses.reduce((acc, e) => acc + e.amount, 0), [currentExpenses]);
  const prevExpenseTotal = useMemo(() => previousExpenses.reduce((acc, e) => acc + e.amount, 0), [previousExpenses]);

  // پورسانت محاسبه شده در این دوره
  const currentCommissionsTotal = useMemo(() => {
    return currentSales.reduce((sum, s) => {
      const seller = users.find(u =>
        u.id === s.sellerId ||
        (s.sellerName && (
          u.fullName.trim() === s.sellerName.trim() ||
          u.fullName.includes(s.sellerName.trim()) ||
          s.sellerName.includes(u.fullName.trim())
        ))
      );
      const rate = typeof seller?.commissionRate === 'number' ? seller.commissionRate : 5;
      return sum + Math.round(s.totalAmount * (rate / 100));
    }, 0);
  }, [currentSales, users]);

  // سود خالص واقعی = سود ناخالص منهای هزینه‌های دوره منهای پورسانت فروشندگان
  const currentNetProfit = currentGrossProfit - currentExpenseTotal - (selectedSellerId === 'ALL' ? currentCommissionsTotal : 0);
  const prevNetProfit = prevGrossProfit - prevExpenseTotal;

  // تعداد کالا و فاکتور
  const currentInvoicesCount = currentSales.length;
  const currentUnitsSold = useMemo(() => currentSales.reduce((acc, s) => acc + s.quantity, 0), [currentSales]);
  const avgOrderValue = currentInvoicesCount > 0 ? Math.round(currentRevenue / currentInvoicesCount) : 0;
  const profitMarginPercent = currentRevenue > 0 ? Math.round((currentNetProfit / currentRevenue) * 100) : 0;

  // درصد رشد نسبت به دوره قبل
  const revenueGrowth = prevRevenue > 0 ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100) : 0;
  const profitGrowth = prevNetProfit !== 0 ? Math.round(((currentNetProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100) : 0;

  // آماده‌سازی اطلاعات نمودار بر اساس روز/هفته‌های ماه شمسی/ماه‌های شمسی
  const chartData = useMemo(() => {
    if (period === 'WEEKLY') {
      const daysMap: Record<string, { label: string; date: string; sales: number; profit: number; expenses: number }> = {};
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const dateKey = getLocalDateKey(d);
        const dayLabel = new Intl.DateTimeFormat('fa-IR', {
          weekday: 'narrow',
          month: 'numeric',
          day: 'numeric',
        }).format(d);
        daysMap[dateKey] = { label: dayLabel, date: dateKey, sales: 0, profit: 0, expenses: 0 };
      }

      currentSales.forEach(s => {
        const d = new Date(s.date);
        if (Number.isNaN(d.getTime())) return;
        const dKey = getLocalDateKey(d);
        if (daysMap[dKey]) {
          daysMap[dKey].sales += s.totalAmount;
          daysMap[dKey].profit += s.profit;
        }
      });

      currentExpenses.forEach(e => {
        const d = new Date(e.date);
        if (Number.isNaN(d.getTime())) return;
        const dKey = getLocalDateKey(d);
        if (daysMap[dKey]) {
          daysMap[dKey].expenses += e.amount;
        }
      });

      return Object.values(daysMap);
    }

    if (period === 'MONTHLY') {
      if (selectedJalaliMonth) {
        const monthLen = getJalaliMonthLength(selectedJalaliMonth.jy, selectedJalaliMonth.jm);
        const intervals = [
          { label: 'هفته ۱ (۱ تا ۷)', minDay: 1, maxDay: 7, sales: 0, profit: 0, expenses: 0 },
          { label: 'هفته ۲ (۸ تا ۱۴)', minDay: 8, maxDay: 14, sales: 0, profit: 0, expenses: 0 },
          { label: 'هفته ۳ (۱۵ تا ۲۱)', minDay: 15, maxDay: 21, sales: 0, profit: 0, expenses: 0 },
          {
            label: `هفته ۴ (۲۲ تا ${toPersianDigits(monthLen)})`,
            minDay: 22,
            maxDay: 31,
            sales: 0,
            profit: 0,
            expenses: 0,
          },
        ];

        currentSales.forEach(s => {
          const d = new Date(s.date);
          if (Number.isNaN(d.getTime())) return;
          const { jd } = getJalaliFromDate(d);
          const idx = intervals.findIndex(inv => jd >= inv.minDay && jd <= inv.maxDay);
          if (idx !== -1) {
            intervals[idx].sales += s.totalAmount;
            intervals[idx].profit += s.profit;
          }
        });

        currentExpenses.forEach(e => {
          const d = new Date(e.date);
          if (Number.isNaN(d.getTime())) return;
          const { jd } = getJalaliFromDate(d);
          const idx = intervals.findIndex(inv => jd >= inv.minDay && jd <= inv.maxDay);
          if (idx !== -1) {
            intervals[idx].expenses += e.amount;
          }
        });

        return intervals;
      }

      // حالت ۳۰ روز چرخشی
      const todayEnd = endDate.getTime();
      const intervals = [
        { label: 'هفته ۴ (۷ روز اخیر)', start: 0, end: 7, sales: 0, profit: 0, expenses: 0 },
        { label: 'هفته ۳ (۸-۱۴ روز قبل)', start: 7, end: 14, sales: 0, profit: 0, expenses: 0 },
        { label: 'هفته ۲ (۱۵-۲۱ روز قبل)', start: 14, end: 21, sales: 0, profit: 0, expenses: 0 },
        { label: 'هفته ۱ (۲۲-۳۰ روز قبل)', start: 21, end: 31, sales: 0, profit: 0, expenses: 0 },
      ];

      currentSales.forEach(s => {
        const diffDays = Math.floor((todayEnd - new Date(s.date).getTime()) / (1000 * 3600 * 24));
        const idx = intervals.findIndex(inv => diffDays >= inv.start && diffDays < inv.end);
        if (idx !== -1) {
          intervals[idx].sales += s.totalAmount;
          intervals[idx].profit += s.profit;
        }
      });

      currentExpenses.forEach(e => {
        const diffDays = Math.floor((todayEnd - new Date(e.date).getTime()) / (1000 * 3600 * 24));
        const idx = intervals.findIndex(inv => diffDays >= inv.start && diffDays < inv.end);
        if (idx !== -1) {
          intervals[idx].expenses += e.amount;
        }
      });

      return intervals.reverse();
    }

    // سالانه: ۱۲ ماه اخیر شمسی
    const monthsMap: Record<string, { label: string; sales: number; profit: number; expenses: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const m = shiftJalaliMonth(currentJalali.jy, currentJalali.jm, -i);
      const monthKey = toJalaliMonthKey(m.jy, m.jm);
      const monthLabel = `${PERSIAN_MONTHS[m.jm - 1]} ${toPersianDigits(m.jy % 100)}`;
      monthsMap[monthKey] = { label: monthLabel, sales: 0, profit: 0, expenses: 0 };
    }

    currentSales.forEach(s => {
      const d = new Date(s.date);
      if (Number.isNaN(d.getTime())) return;
      const j = getJalaliFromDate(d);
      const mKey = toJalaliMonthKey(j.jy, j.jm);
      if (monthsMap[mKey]) {
        monthsMap[mKey].sales += s.totalAmount;
        monthsMap[mKey].profit += s.profit;
      }
    });

    currentExpenses.forEach(e => {
      const d = new Date(e.date);
      if (Number.isNaN(d.getTime())) return;
      const j = getJalaliFromDate(d);
      const mKey = toJalaliMonthKey(j.jy, j.jm);
      if (monthsMap[mKey]) {
        monthsMap[mKey].expenses += e.amount;
      }
    });

    return Object.values(monthsMap);
  }, [period, selectedJalaliMonth, currentJalali, currentSales, currentExpenses, endDate]);

  // پرفروش‌ترین کالاها در این بازه
  const topProducts = useMemo(() => {
    const map: Record<string, { id: string; name: string; quantity: number; revenue: number; profit: number }> = {};

    currentSales.forEach(s => {
      if (!map[s.productId]) {
        map[s.productId] = {
          id: s.productId,
          name: s.productName,
          quantity: 0,
          revenue: 0,
          profit: 0
        };
      }
      map[s.productId].quantity += s.quantity;
      map[s.productId].revenue += s.totalAmount;
      map[s.productId].profit += s.profit;
    });

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [currentSales]);

  // عملکرد و سهم فروشندگان در این بازه (بر اساس کل فروش‌های دوره انتخاب‌شده)
  const sellersPerformance = useMemo(() => {
    return users
      .map(u => {
        const uSales = periodSales.filter(s => matchesSeller(s, u.id, users));

        const revenue = uSales.reduce((acc, s) => acc + s.totalAmount, 0);
        const profit = uSales.reduce((acc, s) => acc + s.profit, 0);
        const count = uSales.length;
        const rate = typeof u.commissionRate === 'number' ? u.commissionRate : 5;
        const commission = Math.round(revenue * (rate / 100));
        const share = periodRevenue > 0 ? (revenue / periodRevenue) * 100 : 0;

        return {
          user: u,
          revenue,
          profit,
          count,
          rate,
          commission,
          share,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [users, periodSales, periodRevenue]);

  // خروجی اکسل/CSV
  const handleExportCSV = () => {
    const headers = ['کد فاکتور', 'تاریخ', 'نام محصول', 'تعداد', 'فروشنده', 'مبلغ کل (تومان)', 'سود (تومان)'];
    const rows = currentSales.map(s => [
      s.id.split('__')[0].split('@')[0],
      new Date(s.date).toLocaleDateString('fa-IR'),
      `"${s.productName.replace(/"/g, '""')}"`,
      s.quantity,
      `"${(s.sellerName || 'مدیر سیستم').replace(/"/g, '""')}"`,
      s.totalAmount,
      s.profit
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const monthSuffix = period === 'MONTHLY' ? `-${selectedMonthKey}` : '';
    link.setAttribute('download', `financial-report-${period.toLowerCase()}${monthSuffix}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* سربرگ داشبورد گزارشات و سوئیچر دوره‌ها */}
      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
              <BarChart3 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-800">داشبورد جامع گزارشات و تصمیم‌گیری</h1>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-full">
                  سطح دسترسی مدیر
                </span>
              </div>
              <p className="text-xs text-slate-400 font-bold mt-1">
                تحلیل یکپارچه مالی، سود خالص، هزینه‌ها، پرفروش‌ترین اقلام و عملکرد فروشندگان
              </p>
            </div>
          </div>
        </div>

        {/* فیلتر دوره زمانی و ابزارهای پرینت/خروجی */}
        <div className="flex flex-wrap items-center gap-3">
          {/* دکمه‌های دوره: هفتگی / ماهانه / سالانه */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner">
            <button
              onClick={() => setPeriod('WEEKLY')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                period === 'WEEKLY'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هفتگی (۷ روز)
            </button>
            <button
              onClick={() => setPeriod('MONTHLY')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                period === 'MONTHLY'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ماهانه (تقویمی)
            </button>
            <button
              onClick={() => setPeriod('YEARLY')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                period === 'YEARLY'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سالانه (۱۲ ماه)
            </button>
          </div>

          {/* انتخابگر ماه شمسی دقیق در حالت ماهانه */}
          {period === 'MONTHLY' && (
            <div className="flex items-center gap-1 bg-indigo-50/70 border border-indigo-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={!canGoPrevMonth}
                title="ماه قبل"
                className="p-2 rounded-xl text-indigo-700 hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight size={16} />
              </button>
              <div className="relative flex items-center">
                <Calendar size={14} className="text-indigo-600 mr-2 pointer-events-none shrink-0" />
                <select
                  value={selectedMonthKey}
                  onChange={e => setSelectedMonthKey(e.target.value)}
                  className="bg-transparent text-indigo-900 text-xs font-black py-1.5 pl-2 pr-1 outline-none cursor-pointer"
                  aria-label="انتخاب ماه شمسی"
                >
                  {availableMonthOptions.map(opt => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                disabled={!canGoNextMonth}
                title="ماه بعد"
                className="p-2 rounded-xl text-indigo-700 hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}

          {/* فیلتر فروشنده */}
          <div className="relative">
            <select
              value={selectedSellerId}
              onChange={e => setSelectedSellerId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2.5 px-3.5 pr-8 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">همه فروشندگان (کل کسب‌وکار)</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.role === 'ADMIN' ? 'مدیر' : 'فروشنده'})
                </option>
              ))}
            </select>
          </div>

          {/* دکمه‌های پرینت و خروجی */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            title="چاپ گزارش رسمی"
          >
            <Printer size={16} />
            <span>چاپ</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20"
            title="دانلود فایل اکسل داده‌های این دوره"
          >
            <Download size={16} />
            <span>خروجی Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ردیف اول: کارت‌های وضعیت در یک نگاه (با دید اول وضعیت را ببیند) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* کل فروش دوره */}
        <div className="p-6 bg-white rounded-[2.2rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
              <ShoppingCart size={22} />
            </div>
            {revenueGrowth !== 0 && (
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-black px-2.5 py-1 rounded-xl ${
                revenueGrowth > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {revenueGrowth > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(revenueGrowth)}٪ رشد
              </span>
            )}
          </div>
          <span className="text-slate-400 text-xs font-bold block mb-1">کل فروش این دوره</span>
          <p className="text-2xl font-black text-slate-900">{formatPrice(currentRevenue)}</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
            <span>تعداد فاکتورها:</span>
            <span className="text-indigo-600 font-black">{currentInvoicesCount} عدد</span>
          </div>
        </div>

        {/* سود خالص واقعی */}
        <div className="p-6 bg-white rounded-[2.2rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
              <DollarSign size={22} />
            </div>
            <span className="text-[11px] font-black bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl">
              حاشیه سود: {profitMarginPercent}٪
            </span>
          </div>
          <span className="text-slate-400 text-xs font-bold block mb-1">سود خالص واقعی دوره</span>
          <p className={`text-2xl font-black ${currentNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatPrice(currentNetProfit)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
            <span>سود ناخالص اولیه:</span>
            <span className="text-slate-700 font-black">{formatPrice(currentGrossProfit)}</span>
          </div>
        </div>

        {/* کل هزینه‌های عملیاتی */}
        <div className="p-6 bg-white rounded-[2.2rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Wallet size={22} />
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
              {currentExpenses.length} فقره هزینه
            </span>
          </div>
          <span className="text-slate-400 text-xs font-bold block mb-1">مجموع هزینه‌های جاری</span>
          <p className="text-2xl font-black text-rose-600">{formatPrice(currentExpenseTotal)}</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
            <span>{selectedSellerId === 'ALL' ? 'پورسانت تعهد شده:' : 'پورسانت این فروشنده:'}</span>
            <span className="text-slate-700 font-black">{formatPrice(currentCommissionsTotal)}</span>
          </div>
        </div>

        {/* میانگین سبد خرید و تیراژ فروش */}
        <div className="p-6 bg-white rounded-[2.2rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Layers size={22} />
            </div>
            <span className="text-[11px] font-black bg-amber-50 text-amber-700 px-2.5 py-1 rounded-xl">
              تیراژ: {currentUnitsSold} کالا
            </span>
          </div>
          <span className="text-slate-400 text-xs font-bold block mb-1">میانگین ارزش هر فاکتور</span>
          <p className="text-2xl font-black text-slate-800">{formatPrice(avgOrderValue)}</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
            <span>کل کالا فروخته شده:</span>
            <span className="text-amber-700 font-black">{currentUnitsSold} قلم</span>
          </div>
        </div>
      </div>

      {/* خلاصه ارزیابی هوشمند بازدهی */}
      <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <Sparkles size={24} className="text-amber-300" />
          </div>
          <div>
            <h4 className="font-black text-sm text-indigo-100">ارزیابی عملکرد و تراز تجاری {periodLabel}</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {currentRevenue > 0 ? (
                <>
                  در این بازه، هزینه‌های جاری معادل <span className="text-amber-300 font-black">{Math.round((currentExpenseTotal / currentRevenue) * 100)}٪</span> از درآمد را شامل شده و بازدهی نهایی روی <span className="text-emerald-300 font-black">{profitMarginPercent}٪</span> ثبت شده است.
                </>
              ) : (
                'در بازه زمانی انتخابی هنوز فاکتور فعالی ثبت نشده است.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right pl-4 border-l border-white/10">
            <span className="block text-[10px] text-slate-400 font-bold">تراز خالص عملیاتی:</span>
            <span className={`text-base font-black ${currentNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatPrice(currentNetProfit)}
            </span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-indigo-200">
            {periodBadge}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ردیف دوم: نمودار روند مالی جامع */}
      {/* ========================================================================= */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-800">تحلیل مقایسه‌ای روند فروش، سود و هزینه‌ها</h3>
            <p className="text-xs text-slate-400 font-bold mt-1">
              تفکیک زمانی درآمد، سود ناخالص و هزینه‌های عملیاتی در {periodLabel}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-indigo-600">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
              فروش کل
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              سود ناخالص
            </span>
            <span className="flex items-center gap-1.5 text-rose-500">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              هزینه‌ها
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSalesTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfitTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenseTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
              <YAxis 
                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} 
                orientation="right"
              />
              <Tooltip
                contentStyle={{
                  textAlign: 'right',
                  direction: 'rtl',
                  borderRadius: '20px',
                  border: 'none',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                  padding: '16px',
                  backgroundColor: '#ffffff'
                }}
                formatter={(value: any, name: string) => {
                  const labelMap: Record<string, string> = {
                    sales: 'فروش کل',
                    profit: 'سود ناخالص',
                    expenses: 'هزینه‌ها'
                  };
                  return [formatPrice(Number(value)), labelMap[name] || name];
                }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#4f46e5"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSalesTrend)"
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorProfitTrend)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpenseTrend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ردیف سوم: پرفروش‌ترین کالاها و سهم فروشندگان در دوره */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* پرفروش‌ترین محصولات دوره */}
        <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Package size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">۵ کالای برتر و پرفروش دوره</h3>
                <p className="text-[11px] text-slate-400 font-bold">بیشترین حجم فروش و ارزش نقدی (تومان) ایجاد شده</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {topProducts.length} محصول شاخص
            </span>
          </div>

          {topProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Package size={36} className="mx-auto opacity-20" />
              <p className="text-xs font-bold">در این بازه کالایی به فروش نرسیده است.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, index) => {
                const shareOfTotal = currentRevenue > 0 ? (p.revenue / currentRevenue) * 100 : 0;
                return (
                  <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                          index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-slate-200 text-slate-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-black text-sm text-slate-800">{p.name}</span>
                      </div>
                      <span className="font-black text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        {p.quantity} عدد فروخته شده
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500 font-bold">
                        مجموع فروش: <span className="text-slate-800 font-black">{formatPrice(p.revenue)}</span>
                      </span>
                      <span className="text-emerald-600 font-bold">
                        سود: <span className="font-black">{formatPrice(p.profit)}</span>
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, shareOfTotal)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* سهم فروشندگان در دوره انتخابی */}
        <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Award size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">سهم و کارکرد فروشندگان در این دوره</h3>
                <p className="text-[11px] text-slate-400 font-bold">تفکیک فروش و پورسانت متعلقه در {periodLabel}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {sellersPerformance.filter(s => s.count > 0).length} فروشنده فعال
            </span>
          </div>

          {sellersPerformance.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Users size={36} className="mx-auto opacity-20" />
              <p className="text-xs font-bold">کاربری ثبت نشده است.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sellersPerformance.map(({ user, revenue, count, rate, commission, share }) => {
                const isSelected = selectedSellerId === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedSellerId(prev => (prev === user.id ? 'ALL' : user.id))}
                    title={isSelected ? 'کلیک برای نمایش کل فروشگاه' : 'کلیک برای فیلتر گزارش این فروشنده'}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/15'
                        : 'bg-slate-50 border-slate-100 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-slate-800 block">{user.fullName}</span>
                            {isSelected && (
                              <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-lg">
                                فیلتر فعال
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">{count} فاکتور در {periodLabel}</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="font-black text-xs text-slate-900 block">{formatPrice(revenue)}</span>
                        <span className="text-[10px] font-bold text-indigo-600">
                          {period === 'MONTHLY' && selectedJalaliMonth ? 'سهم از کل ماه' : 'سهم از کل دوره'}: {share.toFixed(1)}٪
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100/80 mt-2">
                      <span className="text-slate-500 font-bold text-[11px]">
                        پورسانت متعلقه دوره ({rate}٪):
                      </span>
                      <span className="text-emerald-600 font-black text-xs">{formatPrice(commission)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ردیف چهارم: جدول ریزعملکرد فاکتورهای این دوره */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-7 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-800">ریز اسناد و فاکتورهای صادره در دوره</h3>
            <p className="text-xs text-slate-400 font-bold mt-1">
              مشاهده تمامی {currentSales.length} فاکتور ثبت شده با جزئیات کامل و امکان بازبینی
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
              مجموع اقلام: {currentUnitsSold} عدد
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs uppercase font-black border-b border-slate-100">
                <th className="px-6 py-4">تاریخ ثبت</th>
                <th className="px-6 py-4">عنوان کالا</th>
                <th className="px-6 py-4 text-center">تعداد</th>
                <th className="px-6 py-4">فروشنده</th>
                <th className="px-6 py-4 font-black">مبلغ فروش</th>
                <th className="px-6 py-4 font-black text-emerald-600">سود ناخالص</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {currentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-bold text-xs">
                    هیچ فاکتوری در این دوره ثبت نشده است.
                  </td>
                </tr>
              ) : (
                currentSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 text-xs font-bold">
                      {new Date(sale.date).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800">
                      {sale.productName}
                    </td>
                    <td className="px-6 py-4 text-center font-black text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">
                        {sale.quantity} عدد
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                        sale.sellerName && !sale.sellerName.includes('مدیر') 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/60' 
                          : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                      }`}>
                        {sale.sellerName || 'مدیر سیستم'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 text-sm">
                      {formatPrice(sale.totalAmount)}
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-600 text-sm">
                      {formatPrice(sale.profit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {currentSales.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50/80 font-black text-slate-900 border-t-2 border-slate-200 text-sm">
                  <td className="px-6 py-4" colSpan={2}>
                    جمع کل فاکتورهای دوره ({currentSales.length} مورد)
                  </td>
                  <td className="px-6 py-4 text-center text-indigo-600">
                    {currentUnitsSold} عدد
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 text-indigo-600 text-base">
                    {formatPrice(currentRevenue)}
                  </td>
                  <td className="px-6 py-4 text-emerald-600 text-base">
                    {formatPrice(currentGrossProfit)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsManager;
