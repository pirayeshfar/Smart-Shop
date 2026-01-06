
import React, { useState } from 'react';
import { User as UserIcon, Lock, LogIn, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<Props> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // یوزرنیم و پسورد پیش‌فرض ادمین اگر دیتابیس خالی بود
    if (username === 'admin' && password === 'admin') {
      onLogin({
        id: 'admin-id',
        username: 'admin',
        password: 'admin',
        role: 'ADMIN',
        fullName: 'مدیر ارشد'
      });
      return;
    }

    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('نام کاربری یا رمز عبور اشتباه است.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl">
      <div className="w-full max-w-md p-8 bg-white/90 rounded-[2.5rem] shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4 rotate-3">
            <LogIn className="text-white" size={36} />
          </div>
          <h1 className="text-2xl font-black text-slate-800">ورود به سامانه مدیریت</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">لطفاً اطلاعات کاربری خود را وارد کنید</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mr-1">نام کاربری</label>
            <div className="relative">
              <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                required
                className="w-full pr-12 pl-4 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mr-1">رمز عبور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                required
                className="w-full pr-12 pl-4 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl text-xs font-bold animate-pulse">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
          >
            ورود امن
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          Smart Shop Management System v2.0
        </p>
      </div>
    </div>
  );
};

export default Login;
