
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Package, DollarSign, AlertCircle } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="کل فروش" 
          value={formatPrice(stats.totalSales)} 
          icon={<TrendingUp className="text-emerald-600" />}
          bgColor="bg-emerald-50"
        />
        <StatCard 
          title="سود خالص" 
          value={formatPrice(stats.netProfit)} 
          icon={<DollarSign className="text-indigo-600" />}
          bgColor="bg-indigo-50"
        />
        <StatCard 
          title="هزینه‌های جاری" 
          value={formatPrice(stats.totalExpenses)} 
          icon={<TrendingDown className="text-rose-600" />}
          bgColor="bg-rose-50"
        />
        <StatCard 
          title="هشدار موجودی" 
          value={stats.lowStockCount.toString() + ' کالا'} 
          icon={<AlertCircle className="text-amber-600" />}
          bgColor="bg-amber-50"
          highlight={stats.lowStockCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-lg font-bold text-slate-800 mb-6">روند فروش اخیر</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales.slice(-7)}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ textAlign: 'right', direction: 'rtl' }}
                  formatter={(value: any) => [formatPrice(value), 'مبلغ']}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalAmount" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-lg font-bold text-slate-800 mb-4">کمبود موجودی</h3>
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {lowStockItems.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">تمامی کالاها موجودی کافی دارند.</p>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.name}</p>
                    <p className="text-xs text-amber-700">موجودی: {item.stock} عدد</p>
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    نقطه سفارش: {item.reorderPoint}
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
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, bgColor, highlight }) => (
  <div className={`p-6 rounded-2xl shadow-sm border bg-white ${highlight ? 'ring-2 ring-amber-400 ring-opacity-50' : ''}`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${bgColor}`}>
        {icon}
      </div>
    </div>
    <h4 className="text-slate-500 text-sm font-medium mb-1">{title}</h4>
    <p className="text-2xl font-bold text-slate-900 leading-tight truncate">{value}</p>
  </div>
);

export default Dashboard;
