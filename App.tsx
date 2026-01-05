
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wallet, 
  BrainCircuit, 
  Menu, 
  X
} from 'lucide-react';
import { View, Product, Sale, Expense } from './types';
import { DB } from './services/db';
import Dashboard from './components/Dashboard';
import ProductManager from './components/ProductManager';
import SalesManager from './components/SalesManager';
import ExpenseManager from './components/ExpenseManager';
import AIInsights from './components/AIInsights';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    setProducts(DB.getProducts());
    setSales(DB.getSales());
    setExpenses(DB.getExpenses());
  }, []);

  useEffect(() => { DB.saveProducts(products); }, [products]);
  useEffect(() => { DB.saveSales(sales); }, [sales]);
  useEffect(() => { DB.saveExpenses(expenses); }, [expenses]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navigation = [
    { name: 'داشبورد', icon: LayoutDashboard, view: View.DASHBOARD },
    { name: 'انبار محصولات', icon: Package, view: View.PRODUCTS },
    { name: 'ثبت فروش', icon: ShoppingCart, view: View.SALES },
    { name: 'مدیریت هزینه‌ها', icon: Wallet, view: View.EXPENSES },
    { name: 'تحلیل هوشمند (AI)', icon: BrainCircuit, view: View.AI_INSIGHTS },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-vazirmatn overflow-x-hidden">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-72 bg-slate-900 text-white transform transition-all duration-300 ease-in-out border-l border-slate-800
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center gap-3 h-20 px-8 bg-slate-900/50 border-b border-slate-800">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShoppingCart className="text-white" size={24} />
          </div>
          <span className="text-lg font-black tracking-tight">پنل مدیریت</span>
        </div>
        
        <nav className="mt-8 px-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.view}
              onClick={() => {
                setCurrentView(item.view);
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`
                flex items-center w-full px-5 py-4 rounded-2xl transition-all duration-200 group
                ${currentView === item.view 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 translate-x-[-4px]' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon className={`ml-4 transition-transform ${currentView === item.view ? 'scale-110' : 'group-hover:scale-110'}`} size={22} />
              <span className="text-sm font-bold">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-8 left-0 right-0 px-6">
          <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2 text-right">وضعیت سیستم</p>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs text-slate-300">دیتابیس متصل است</span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pr-72 transition-all duration-300 min-w-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="lg:hidden p-2 bg-slate-100 rounded-xl text-slate-600">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-black text-slate-800">
              {navigation.find(n => n.view === currentView)?.name}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col text-left items-end">
              <span className="text-sm font-bold text-slate-900">امروز</span>
              <span className="text-xs text-slate-500 font-medium">
                {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date())}
              </span>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 w-full">
          <div className="max-w-[1600px] mx-auto">
            {currentView === View.DASHBOARD && (
              <Dashboard products={products} sales={sales} expenses={expenses} />
            )}
            {currentView === View.PRODUCTS && (
              <ProductManager products={products} setProducts={setProducts} />
            )}
            {currentView === View.SALES && (
              <SalesManager products={products} setProducts={setProducts} sales={sales} setSales={setSales} />
            )}
            {currentView === View.EXPENSES && (
              <ExpenseManager expenses={expenses} setExpenses={setExpenses} />
            )}
            {currentView === View.AI_INSIGHTS && (
              <AIInsights products={products} sales={sales} expenses={expenses} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
