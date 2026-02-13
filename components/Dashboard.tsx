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