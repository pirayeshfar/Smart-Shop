
import React, { useState } from 'react';
import { UserPlus, Trash2, Shield, User as UserIcon, X, Percent, Edit3, Check } from 'lucide-react';
import { User, Role } from '../types';
import { DB } from '../services/db';

interface Props {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const UserManager: React.FC<Props> = ({ users, setUsers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<number>(5);

  const [formData, setFormData] = useState<Partial<User>>({
    username: '', password: '', fullName: '', role: 'SALESPERSON', commissionRate: 5
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = { 
      ...formData, 
      id: Date.now().toString(),
      commissionRate: Number(formData.commissionRate) || 5
    } as User;
    await DB.saveUser(newUser);
    setUsers([...users, newUser]);
    setIsModalOpen(false);
    setFormData({ username: '', password: '', fullName: '', role: 'SALESPERSON', commissionRate: 5 });
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

  const handleUpdateCommission = async (user: User) => {
    const updatedUser = { ...user, commissionRate: editingRate };
    await DB.saveUser(updatedUser);
    setUsers(users.map(u => u.id === user.id ? updatedUser : u));
    setEditingUserId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">مدیریت سیستم و کاربران</h2>
          <p className="text-slate-500 text-sm mt-1">
            تعریف فروشندگان، تعیین سطح دسترسی و تنظیم نرخ پورسانت اختصاصی هر فروشنده
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <UserPlus size={20} />
          <span>افزودن فروشنده / کاربر جدید</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${user.role === 'ADMIN' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  <UserIcon size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800">{user.fullName}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Shield size={12} className={user.role === 'ADMIN' ? 'text-amber-500' : 'text-indigo-400'} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${user.role === 'ADMIN' ? 'text-amber-600' : 'text-indigo-600'}`}>
                      {user.role === 'ADMIN' ? 'مدیر سیستم' : 'فروشنده'}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleDelete(user.id)}
                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                title="حذف کاربر"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* بخش نمایش و ویرایش درصد پورسانت در کارت کاربر */}
            <div className="mt-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <Percent size={14} className="text-indigo-500" />
                <span>درصد پورسانت فروش:</span>
              </div>

              {editingUserId === user.id ? (
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="0.5"
                    value={editingRate}
                    onChange={e => setEditingRate(parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 bg-white border border-indigo-300 rounded-lg text-center font-black text-xs text-indigo-600 outline-none"
                  />
                  <button 
                    onClick={() => handleUpdateCommission(user)}
                    className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                    title="ذخیره"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-black text-indigo-600 text-sm">
                    {user.commissionRate ?? 5} ٪
                  </span>
                  <button 
                    onClick={() => {
                      setEditingUserId(user.id);
                      setEditingRate(user.commissionRate ?? 5);
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                    title="ویرایش نرخ پورسانت"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
              <span>نام کاربری:</span>
              <span className="text-slate-700 font-bold">{user.username}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-800">ایجاد کاربر جدید</h2>
                <p className="text-xs text-slate-400 font-bold mt-1">مشخصات و میزان پورسانت فروشنده را وارد کنید</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">نام و نام خانوادگی</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">نام کاربری</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">رمز عبور</label>
                <input required type="password" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">نقش کاربر</label>
                  <select 
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as Role})}
                  >
                    <option value="SALESPERSON">فروشنده</option>
                    <option value="ADMIN">مدیر سیستم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">درصد پورسانت (٪)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="0.5"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold" 
                    value={formData.commissionRate} 
                    onChange={e => setFormData({...formData, commissionRate: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black mt-4 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-sm">
                ایجاد کاربر و ثبت پورسانت
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
