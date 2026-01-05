
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Package, DollarSign, AlertCircle, ShoppingCart } from 'lucide-react';
import { Product, Sale, Expense } from '../types';
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
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price) + ' ریال';
};

const Dashboard: React.FC<Props> = ({ products, sales, expenses }) => {
  const stats = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalProfit - totalExpenses;
    const lowStockCount = products.filter(p => p.stock <= p.reorderPoint).length;

    return { totalSales, netProfit, totalExpenses, lowStockCount };
  }, [products, sales, expenses]);

  const lowStockItems = products.filter(p => p.stock <= p.reorderPoint);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stat Cards */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800">تحلیل روند فروش</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
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
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }}
                  formatter={(value: any) => [formatPrice(value), 'مبلغ']}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalAmount" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Package size={20} className="text-indigo-600" />
            هشدار موجودی
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Package size={48} className="mb-2 opacity-20" />
                <p className="text-sm">انبار کاملاً شارژ است</p>
              </div>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">سایز: {item.size} | رنگ: {item.color}</p>
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                      {item.stock} عدد
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
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
  <div className={`p-6 rounded-3xl shadow-sm border border-slate-100 bg-white transition-all hover:shadow-md ${highlight ? 'ring-2 ring-amber-400' : ''}`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${bgColor}`}>
        {icon}
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <h4 className="text-slate-500 text-xs font-medium mb-1">{title}</h4>
    <p className="text-xl font-black text-slate-900 leading-tight truncate">{value}</p>
  </div>
);

export default Dashboard;
