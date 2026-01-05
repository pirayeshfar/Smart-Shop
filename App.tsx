
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wallet, 
  BrainCircuit, 
  Plus, 
  Menu, 
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle
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

  // Initial Load
  useEffect(() => {
    setProducts(DB.getProducts());
    setSales(DB.getSales());
    setExpenses(DB.getExpenses());
  }, []);

  // Update DB when state changes
  useEffect(() => { DB.saveProducts(products); }, [products]);
  useEffect(() => { DB.saveSales(sales); }, [sales]);
  useEffect(() => { DB.saveExpenses(expenses); }, [expenses]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navigation = [
    { name: 'داشبورد', icon: LayoutDashboard, view: View.DASHBOARD },
    { name: 'محصولات', icon: Package, view: View.PRODUCTS },
    { name: 'فروش', icon: ShoppingCart, view: View.SALES },
    { name: 'هزینه‌ها', icon: Wallet, view: View.EXPENSES },
    { name: 'تحلیل هوشمند', icon: BrainCircuit, view: View.AI_INSIGHTS },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-800">
          <span className="text-xl font-bold tracking-wider">مدیریت فروشگاه</span>
          <button onClick={toggleSidebar} className="lg:hidden text-white">
            <X size={24} />
          </button>
        </div>
        <nav className="mt-6 px-3 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.view}
              onClick={() => {
                setCurrentView(item.view);
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`
                flex items-center w-full px-4 py-3 rounded-lg transition-colors
                ${currentView === item.view ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon className="ml-3" size={20} />
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pr-64">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <button onClick={toggleSidebar} className="lg:hidden text-slate-600">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-800">
              {navigation.find(n => n.view === currentView)?.name}
            </h1>
          </div>
          <div className="text-slate-500 text-sm hidden sm:block">
            {new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {currentView === View.DASHBOARD && (
            <Dashboard 
              products={products} 
              sales={sales} 
              expenses={expenses} 
            />
          )}
          {currentView === View.PRODUCTS && (
            <ProductManager 
              products={products} 
              setProducts={setProducts} 
            />
          )}
          {currentView === View.SALES && (
            <SalesManager 
              products={products} 
              setProducts={setProducts}
              sales={sales}
              setSales={setSales}
            />
          )}
          {currentView === View.EXPENSES && (
            <ExpenseManager 
              expenses={expenses} 
              setExpenses={setExpenses} 
            />
          )}
          {currentView === View.AI_INSIGHTS && (
            <AIInsights 
              products={products}
              sales={sales}
              expenses={expenses}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
