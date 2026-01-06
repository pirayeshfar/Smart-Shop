
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wallet, 
  BrainCircuit, 
  Menu, 
  AlertTriangle,
  RefreshCw,
  Settings,
  LogOut,
  User as UserIcon,
  Copyright
} from 'lucide-react';
import { View, Product, Sale, Expense, User } from './types';
import { DB } from './services/db';
import Dashboard from './components/Dashboard';
import ProductManager from './components/ProductManager';
import SalesManager from './components/SalesManager';
import ExpenseManager from './components/ExpenseManager';
import AIInsights from './components/AIInsights';
import UserManager from './components/UserManager';
import Login from './components/Login';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'checking'>('checking');

  useEffect(() => {
    const loadInitialData = async () => {
      setConnectionStatus('checking');
      if (DB.isConnected()) {
        try {
          const [p, s, e, u] = await Promise.all([
            DB.getProducts(),
            DB.getSales(),
            DB.getExpenses(),
            DB.getUsers()
          ]);
          setProducts(p);
          setSales(s);
          setExpenses(e);
          setUsers(u);
          setConnectionStatus('connected');
        } catch (err) {
          console.error('Load Error:', err);
          setConnectionStatus('error');
        }
      } else {
        setConnectionStatus('error');
      }
      setIsLoaded(true);
    };
    loadInitialData();
  }, []);

  // ذخیره‌سازی‌های خودکار
  useEffect(() => { if (isLoaded && DB.isConnected()) DB.saveProducts(products); }, [products, isLoaded]);
  useEffect(() => { if (isLoaded && DB.isConnected()) DB.saveSales(sales); }, [sales, isLoaded]);
  useEffect(() => { if (isLoaded && DB.isConnected()) DB.saveExpenses(expenses); }, [expenses, isLoaded]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView(View.DASHBOARD);
  };

  // فیلتر کردن منوها بر اساس سطح دسترسی
  const navigation = [
    { name: 'داشبورد', icon: LayoutDashboard, view: View.DASHBOARD, roles: ['ADMIN'] },
    { name: 'انبار محصولات', icon: Package, view: View.PRODUCTS, roles: ['ADMIN', 'SALESPERSON'] },
    { name: 'ثبت فروش', icon: ShoppingCart, view: View.SALES, roles: ['ADMIN', 'SALESPERSON'] },
    { name: 'مدیریت هزینه‌ها', icon: Wallet, view: View.EXPENSES, roles: ['ADMIN'] },
    { name: 'تحلیل هوشمند (AI)', icon: BrainCircuit, view: View.AI_INSIGHTS, roles: ['ADMIN'] },
    { name: 'مدیریت سیستم', icon: Settings, view: View.USER_MANAGEMENT, roles: ['ADMIN'] },
  ].filter(item => item.roles.includes(currentUser?.role || ''));

  if (!currentUser) {
    return <Login users={users} onLogin={(user) => {
      setCurrentUser(user);
      // انتقال فروشنده به بخش انبار در صورت عدم دسترسی به داشبورد
      if (user.role === 'SALESPERSON') setCurrentView(View.PRODUCTS);
    }} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-vazirmatn overflow-x-hidden text-right flex-col">
      <div className="flex flex-1">
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`
          fixed inset-y-0 right-0 z-50 w-72 bg-slate-900 text-white transform transition-all duration-300 ease-in-out border-l border-slate-800
          lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="flex items-center gap-3 h-24 px-8 bg-slate-900/50 border-b border-slate-800">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShoppingCart className="text-white" size={24} />
            </div>
            <span className="text-lg font-black tracking-tight">Smart Shop</span>
          </div>
          
          <div className="px-6 py-6 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                  <UserIcon size={20} />
               </div>
               <div>
                  <p className="text-sm font-black text-white">{currentUser.fullName}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {currentUser.role === 'ADMIN' ? 'مدیر ارشد' : 'فروشنده'}
                  </p>
               </div>
            </div>
          </div>

          <nav className="mt-6 px-4 space-y-1.5 flex-1">
            {navigation.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                  setCurrentView(item.view);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`
                  flex items-center w-full px-5 py-3.5 rounded-2xl transition-all duration-200 group
                  ${currentView === item.view 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 translate-x-[-4px]' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <item.icon className={`ml-4 transition-transform ${currentView === item.view ? 'scale-110' : 'group-hover:scale-110'}`} size={20} />
                <span className="text-sm font-bold">{item.name}</span>
              </button>
            ))}
          </nav>

          <div className="p-6 mt-auto">
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-bold text-sm"
            >
              <LogOut size={18} />
              <span>خروج از حساب</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 lg:pr-72 transition-all duration-300 min-w-0 flex flex-col">
          <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <button onClick={toggleSidebar} className="lg:hidden p-2 bg-slate-100 rounded-xl text-slate-600">
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-black text-slate-800">
                {navigation.find(n => n.view === currentView)?.name}
              </h1>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={() => window.location.reload()} className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors">
                 <RefreshCw size={20} />
               </button>
               <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-black text-slate-900">امروز</span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date())}
                  </span>
               </div>
            </div>
          </header>

          <div className="p-6 lg:p-10 w-full flex-1">
            <div className="max-w-[1600px] mx-auto">
              {!isLoaded ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-bold">در حال همگام‌سازی...</p>
                </div>
              ) : (
                <>
                  {currentView === View.DASHBOARD && <Dashboard products={products} sales={sales} expenses={expenses} />}
                  {currentView === View.PRODUCTS && <ProductManager products={products} setProducts={setProducts} />}
                  {currentView === View.SALES && <SalesManager products={products} setProducts={setProducts} sales={sales} setSales={setSales} />}
                  {currentView === View.EXPENSES && <ExpenseManager expenses={expenses} setExpenses={setExpenses} />}
                  {currentView === View.AI_INSIGHTS && <AIInsights products={products} sales={sales} expenses={expenses} />}
                  {currentView === View.USER_MANAGEMENT && <UserManager users={users} setUsers={setUsers} />}
                </>
              )}
            </div>
          </div>

          <footer className="py-4 px-10 border-t border-slate-200 bg-white/50 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Copyright size={14} />
              <span className="text-[11px] font-bold">تمامی حقوق مادی و معنوی این سامانه محفوظ است</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <span className="text-slate-400">طراحی و توسعه توسط:</span>
              <span className="text-indigo-600">امیرسامان پیرایش فر</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
