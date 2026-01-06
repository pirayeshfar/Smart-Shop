
import React, { useState } from 'react';
import { UserPlus, Trash2, Shield, User as UserIcon, X } from 'lucide-react';
import { User, Role } from '../types';
import { DB } from '../services/db';

interface Props {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const UserManager: React.FC<Props> = ({ users, setUsers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    username: '', password: '', fullName: '', role: 'SALESPERSON'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = { ...formData, id: Date.now().toString() } as User;
    await DB.saveUser(newUser);
    setUsers([...users, newUser]);
    setIsModalOpen(false);
    setFormData({ username: '', password: '', fullName: '', role: 'SALESPERSON' });
  };

  const handleDelete = async (id: string) => {
    if (id === 'admin-id') {
      alert('کاربر ادمین اصلی قابل حذف نیست!');
      return;
    }
    if (window.confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
      await DB.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">مدیریت دسترسی‌ها</h2>
          <p className="text-slate-500 text-sm">تعریف کاربران جدید و تعیین سطح دسترسی آن‌ها</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
        >
          <UserPlus size={20} />
          <span>افزودن کاربر جدید</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-[2rem] border shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${user.role === 'ADMIN' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                <UserIcon size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-800">{user.fullName}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Shield size={12} className={user.role === 'ADMIN' ? 'text-amber-500' : 'text-slate-400'} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${user.role === 'ADMIN' ? 'text-amber-600' : 'text-slate-500'}`}>
                    {user.role === 'ADMIN' ? 'مدیر سیستم' : 'فروشنده'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="text-xs text-slate-400 font-medium">
                نام کاربری: <span className="text-slate-700 font-bold">{user.username}</span>
              </div>
              <button 
                onClick={() => handleDelete(user.id)}
                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-800">ایجاد دسترسی جدید</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">نام و نام خانوادگی</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">نام کاربری</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">رمز عبور</label>
                <input required type="password" className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">سطح دسترسی</label>
                <select 
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none appearance-none"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as Role})}
                >
                  <option value="SALESPERSON">فروشنده (دسترسی محدود)</option>
                  <option value="ADMIN">مدیر سیستم (دسترسی کامل)</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black mt-4 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                ایجاد کاربر
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
