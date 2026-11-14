import React, { useState } from 'react';
import { 
  UserPlus, 
  Trash2, 
  Shield, 
  User as UserIcon, 
  X, 
  Percent, 
  Edit3, 
  Check, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Lock, 
  Save,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { User, Role } from '../types';
import { DB } from '../services/db';

interface Props {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser?: User | null;
  setCurrentUser?: React.Dispatch<React.SetStateAction<User | null>>;
}

const DEFAULT_ADMIN: User = {
  id: 'admin-id',
  username: 'admin',
  password: 'admin',
  role: 'ADMIN',
  fullName: 'مدیر ارشد سیستم',
  commissionRate: 5
};

const UserManager: React.FC<Props> = ({ users, setUsers, currentUser, setCurrentUser }) => {
  // پیدا کردن حساب مدیر سیستم از دیتابیس؛ اگر هنوز ذخیره نشده باشد از حساب پیش‌فرض استفاده می‌شود
  const dbAdmin = users.find(u => u.id === 'admin-id' || u.role === 'ADMIN');
  const activeAdmin: User = dbAdmin || (currentUser?.role === 'ADMIN' ? currentUser : DEFAULT_ADMIN);
  const isDefaultCredentials = activeAdmin.username.trim() === 'admin' && activeAdmin.password === 'admin';

  // اطمینان از اینکه کارت مدیر سیستم همیشه در لیست کاربران نمایش داده شود
  const displayUsers = dbAdmin ? users : [activeAdmin, ...users];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // وضعیت ویرایش سریع درصد پورسانت در کارت
  const [quickEditUserId, setQuickEditUserId] = useState<string | null>(null);
  const [quickEditRate, setQuickEditRate] = useState<number>(5);

  // نمایش یا مخفی‌سازی رمز عبور در مودال
  const [showPassword, setShowPassword] = useState(false);

  // پیام موفقیت
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // فرم ایجاد کاربر جدید
  const [addFormData, setAddFormData] = useState<Partial<User>>({
    username: '', 
    password: '', 
    fullName: '', 
    role: 'SALESPERSON', 
    commissionRate: 5
  });

  // فرم ویرایش کاربر موجود
  const [editFormData, setEditFormData] = useState<Partial<User>>({
    username: '',
    password: '',
    fullName: '',
    role: 'SALESPERSON',
    commissionRate: 5
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // ایجاد کاربر جدید
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = (addFormData.username || '').trim();
    const cleanFullName = (addFormData.fullName || '').trim();
    const password = addFormData.password || '';

    if (!cleanUsername || !password || !cleanFullName) {
      setFormError('تمامی فیلدها (نام، نام کاربری و رمز عبور) الزامی هستند.');
      return;
    }

    const isDuplicate = displayUsers.some(
      u => u.username.trim().toLowerCase() === cleanUsername.toLowerCase()
    );
    if (isDuplicate) {
      setFormError('این نام کاربری قبلاً برای کاربر دیگری ثبت شده است.');
      return;
    }

    const parsedRate = typeof addFormData.commissionRate === 'number'
      ? addFormData.commissionRate
      : parseFloat(String(addFormData.commissionRate ?? ''));
    const validRate = !isNaN(parsedRate) ? Math.max(0, Math.min(100, parsedRate)) : 5;

    const newUser: User = { 
      id: Date.now().toString(),
      username: cleanUsername,
      password,
      fullName: cleanFullName,
      role: (addFormData.role as Role) || 'SALESPERSON',
      commissionRate: validRate
    };

    setIsSaving(true);
    try {
      await DB.saveUser(newUser);
      setUsers(prev => [...prev, newUser]);
      setIsAddModalOpen(false);
      setAddFormData({ username: '', password: '', fullName: '', role: 'SALESPERSON', commissionRate: 5 });
      showToast(`حساب کاربری ${newUser.fullName} با پورسانت ${validRate}٪ با موفقیت ایجاد شد.`);
    } catch (err) {
      console.error(err);
      setFormError('خطا در ذخیره اطلاعات کاربر جدید!');
    } finally {
      setIsSaving(false);
    }
  };

  // باز کردن مودال ویرایش کاربر
  const handleOpenEditModal = (user: User) => {
    setFormError(null);
    setEditingUser(user);
    setEditFormData({
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      commissionRate: typeof user.commissionRate === 'number' ? user.commissionRate : 5
    });
    setShowPassword(false);
  };

  // ذخیره تغییرات ویرایش کاربر (شامل تغییر نام کاربری و رمز عبور مدیر یا فروشندگان و درصد پورسانت)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || isSaving) return;
    setFormError(null);

    const cleanUsername = (editFormData.username || '').trim();
    const cleanFullName = (editFormData.fullName || '').trim();
    const newPassword = editFormData.password || '';

    if (!cleanUsername || !newPassword || !cleanFullName) {
      setFormError('نام، نام کاربری و رمز عبور نمی‌توانند خالی باشند.');
      return;
    }

    const isDuplicate = displayUsers.some(
      u => u.id !== editingUser.id && u.username.trim().toLowerCase() === cleanUsername.toLowerCase()
    );
    if (isDuplicate) {
      setFormError('این نام کاربری قبلاً استفاده شده است. لطفاً نام کاربری دیگری انتخاب کنید.');
      return;
    }

    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    const isProtectedAdmin = editingUser.id === 'admin-id' || (editingUser.role === 'ADMIN' && adminCount <= 1);
    const finalRole: Role = isProtectedAdmin ? 'ADMIN' : ((editFormData.role as Role) || editingUser.role);

    const parsedRate = typeof editFormData.commissionRate === 'number'
      ? editFormData.commissionRate
      : parseFloat(String(editFormData.commissionRate ?? ''));
    const validRate = !isNaN(parsedRate) ? Math.max(0, Math.min(100, parsedRate)) : (editingUser.commissionRate ?? 5);

    const updatedUser: User = {
      ...editingUser,
      fullName: cleanFullName,
      username: cleanUsername,
      password: newPassword,
      role: finalRole,
      commissionRate: validRate
    };

    setIsSaving(true);
    try {
      await DB.saveUser(updatedUser);

      // به‌روزرسانی لیست کاربران در ری‌اکت
      setUsers(prev => {
        const exists = prev.some(u => u.id === updatedUser.id);
        if (exists) {
          return prev.map(u => u.id === updatedUser.id ? updatedUser : u);
        }
        return [updatedUser, ...prev];
      });

      // اگر مدیر یا کاربرِ فعلی اطلاعات خود را ویرایش کرد، نشست فعال نیز فوراً همگام‌سازی شود
      if (
        currentUser &&
        setCurrentUser &&
        (currentUser.id === updatedUser.id || (currentUser.role === 'ADMIN' && updatedUser.id === 'admin-id'))
      ) {
        setCurrentUser(updatedUser);
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('smart_shop_auth_user', JSON.stringify(updatedUser));
          }
        } catch {
          // ignore
        }
      }

      setEditingUser(null);
      if (updatedUser.role === 'ADMIN') {
        showToast(`نام کاربری و رمز عبور مدیر سیستم («${updatedUser.fullName}») با موفقیت تغییر یافت و در دیتابیس ذخیره شد.`);
      } else {
        showToast(`اطلاعات، رمز عبور و پورسانت (${validRate}٪) کاربر "${updatedUser.fullName}" با موفقیت بروزرسانی شد.`);
      }
    } catch (err) {
      console.error(err);
      setFormError('خطا در ذخیره تغییرات در پایگاه داده!');
    } finally {
      setIsSaving(false);
    }
  };

  // حذف کاربر
  const handleDelete = async (id: string) => {
    const target = displayUsers.find(u => u.id === id);
    const adminCount = displayUsers.filter(u => u.role === 'ADMIN').length;
    if (id === 'admin-id' || (target?.role === 'ADMIN' && adminCount <= 1)) {
      alert('حساب مدیر اصلی سیستم قابل حذف نیست!');
      return;
    }
    if (window.confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
      await DB.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast('کاربر مورد نظر حذف گردید.');
    }
  };

  // ویرایش سریع درصد پورسانت روی کارت
  const handleQuickUpdateCommission = async (user: User) => {
    const validRate = Math.max(0, Math.min(100, quickEditRate));
    const updatedUser = { ...user, commissionRate: validRate };
    await DB.saveUser(updatedUser);
    setUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      if (exists) return prev.map(u => u.id === user.id ? updatedUser : u);
      return [updatedUser, ...prev];
    });
    setQuickEditUserId(null);
    showToast(`درصد پورسانت "${user.fullName}" به ${validRate}٪ تغییر یافت و ذخیره شد.`);
  };

  return (
    <div className="space-y-6">
      {/* اعلان‌های موفقیت (Toast) */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border border-slate-700 text-sm font-bold">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* سربرگ بخش مدیریت سیستم */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">مدیریت سیستم و کاربران</h2>
          <p className="text-slate-500 text-sm mt-1">
            تنظیمات امنیتی مدیر سیستم، تعریف فروشندگان، تغییر نام کاربری/رمز عبور و درصد پورسانت
          </p>
        </div>
        <button 
          onClick={() => {
            setFormError(null);
            setShowPassword(false);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-sm"
        >
          <UserPlus size={18} />
          <span>افزودن فروشنده / کاربر جدید</span>
        </button>
      </div>

      {/* بنر اختصاصی امنیت و تغییر نام کاربری/رمز عبور مدیر سیستم */}
      <div className={`p-6 rounded-[2rem] border flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm ${
        isDefaultCredentials 
          ? 'bg-amber-50 border-amber-200' 
          : 'bg-emerald-50/70 border-emerald-200/80'
      }`}>
        <div className="flex items-start sm:items-center gap-4">
          <div className={`p-3.5 rounded-2xl shrink-0 ${
            isDefaultCredentials ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {isDefaultCredentials ? <ShieldAlert size={26} /> : <ShieldCheck size={26} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base font-black ${isDefaultCredentials ? 'text-amber-900' : 'text-emerald-900'}`}>
                {isDefaultCredentials ? 'هشدار امنیتی: مشخصات پیش‌فرض مدیر سیستم!' : 'امنیت حساب مدیر سیستم فعال است'}
              </h3>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg ${
                isDefaultCredentials ? 'bg-rose-100 text-rose-700' : 'bg-emerald-200/70 text-emerald-800'
              }`}>
                نام کاربری فعلی: {activeAdmin.username}
              </span>
            </div>
            <p className={`text-xs font-bold mt-1 leading-relaxed ${
              isDefaultCredentials ? 'text-amber-800/90' : 'text-emerald-800/80'
            }`}>
              {isDefaultCredentials 
                ? 'حساب مدیر همچنان با نام کاربری و رمز عبور پیش‌فرض (admin) است. برای جلوگیری از دسترسی غیرمجاز، همین الان نام کاربری و رمز عبور جدیدی برای خود تنظیم کنید.'
                : 'رمز عبور و نام کاربری مدیر سیستم شخصی‌سازی شده است و ورود پیش‌فرض (admin/admin) غیرفعال می‌باشد. هر زمان مایل بودید می‌توانید مجدداً آن را تغییر دهید.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenEditModal(activeAdmin)}
          className={`px-5 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shrink-0 shadow-md ${
            isDefaultCredentials
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
              : 'bg-white hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 shadow-emerald-600/5'
          }`}
        >
          <KeyRound size={16} />
          <span>تغییر نام کاربری و رمز مدیر</span>
        </button>
      </div>

      {/* شبکه کارت‌های کاربران */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayUsers.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all space-y-4">
            
            {/* قسمت بالای کارت: مشخصات و دکمه‌های عملیات */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                  user.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {user.fullName.charAt(0) || <UserIcon size={22} />}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base">{user.fullName}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Shield size={12} className={user.role === 'ADMIN' ? 'text-amber-500' : 'text-indigo-400'} />
                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                      user.role === 'ADMIN' ? 'text-amber-600' : 'text-indigo-600'
                    }`}>
                      {user.role === 'ADMIN' ? 'مدیر سیستم' : 'فروشنده'}
                    </span>
                  </div>
                </div>
              </div>

              {/* عملیات: ویرایش کامل و حذف */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleOpenEditModal(user)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-bold text-xs flex items-center gap-1"
                  title="ویرایش کاربر / بازیابی رمز عبور"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(user.id)}
                  className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  title="حذف کاربر"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* بخش اطلاعات اکانت (نام کاربری و رمز عبور) */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>نام کاربری:</span>
                <span className="text-slate-800 font-bold font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  {user.username}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="flex items-center gap-1">
                  <Lock size={12} className="text-slate-400" />
                  رمز عبور:
                </span>
                <span className="text-slate-800 font-bold font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  ••••••••
                </span>
              </div>
            </div>

            {/* بخش نرخ پورسانت روی کارت */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <Percent size={14} className="text-indigo-500" />
                <span>درصد پورسانت:</span>
              </div>

              {quickEditUserId === user.id ? (
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="0.5"
                    value={quickEditRate}
                    onChange={e => setQuickEditRate(parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 bg-white border border-indigo-300 rounded-lg text-center font-black text-xs text-indigo-600 outline-none"
                  />
                  <button 
                    onClick={() => handleQuickUpdateCommission(user)}
                    className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                    title="ذخیره درصد"
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
                      setQuickEditUserId(user.id);
                      setQuickEditRate(user.commissionRate ?? 5);
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                    title="تغییر پورسانت"
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* دکمه اصلی ویرایش کامل / تغییر رمز عبور */}
            <button
              onClick={() => handleOpenEditModal(user)}
              className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <KeyRound size={14} />
              <span>ویرایش مشخصات و رمز عبور</span>
            </button>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* مودال اول: ویرایش کاربر موجود و تغییر / بازیابی رمز عبور */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">ویرایش کاربر و تعیین رمز عبور</h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">
                    تغییر اطلاعات یا بازیابی رمز عبور {editingUser.fullName}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingUser(null)} 
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* نام و نام خانوادگی */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">نام و نام خانوادگی</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold" 
                  value={editFormData.fullName || ''} 
                  onChange={e => setEditFormData({...editFormData, fullName: e.target.value})} 
                />
              </div>

              {/* نام کاربری */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">نام کاربری (جهت ورود)</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold font-mono" 
                  value={editFormData.username || ''} 
                  onChange={e => setEditFormData({...editFormData, username: e.target.value})} 
                />
              </div>

              {/* رمز عبور جدید (جهت تغییر یا بازیابی رمز فراموش شده) */}
              <div>
                <div className="flex justify-between items-center mb-1.5 mr-1">
                  <label className="block text-xs font-bold text-slate-600">
                    رمز عبور جدید (تغییر / بازیابی)
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                    بازیابی رمز فراموش‌شده
                  </span>
                </div>
                <div className="relative">
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold font-mono" 
                    placeholder="رمز عبور جدید را وارد کنید"
                    value={editFormData.password || ''} 
                    onChange={e => setEditFormData({...editFormData, password: e.target.value})} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-1 mr-1">
                  در صورت فراموشی رمز عبور، رمز جدید را اینجا تایپ و ذخیره کنید.
                </p>
              </div>

              {/* نقش و درصد پورسانت */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">سطح دسترسی</label>
                  <select 
                    disabled={editingUser.id === 'admin-id' || (editingUser.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length <= 1)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                    value={editFormData.role || 'SALESPERSON'}
                    onChange={e => setEditFormData({...editFormData, role: e.target.value as Role})}
                  >
                    <option value="SALESPERSON">فروشنده</option>
                    <option value="ADMIN">مدیر سیستم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">درصد پورسانت (٪)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="0.5"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold" 
                    value={editFormData.commissionRate ?? 5} 
                    onChange={e => setEditFormData({...editFormData, commissionRate: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl text-xs font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-lg shadow-indigo-600/20 text-xs flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات و رمز عبور'}</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* مودال دوم: افزودن کاربر جدید */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-800">ایجاد کاربر جدید</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">مشخصات و میزان پورسانت فروشنده را وارد کنید</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">نام و نام خانوادگی</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold" 
                  value={addFormData.fullName} 
                  onChange={e => setAddFormData({...addFormData, fullName: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">نام کاربری</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold font-mono" 
                  value={addFormData.username} 
                  onChange={e => setAddFormData({...addFormData, username: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">رمز عبور</label>
                <div className="relative">
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold font-mono" 
                    value={addFormData.password} 
                    onChange={e => setAddFormData({...addFormData, password: e.target.value})} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">نقش کاربر</label>
                  <select 
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold"
                    value={addFormData.role}
                    onChange={e => setAddFormData({...addFormData, role: e.target.value as Role})}
                  >
                    <option value="SALESPERSON">فروشنده</option>
                    <option value="ADMIN">مدیر سیستم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 mr-1">درصد پورسانت (٪)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="0.5"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold" 
                    value={addFormData.commissionRate} 
                    onChange={e => setAddFormData({...addFormData, commissionRate: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl text-xs font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black mt-2 hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-lg shadow-indigo-600/20 text-xs"
              >
                {isSaving ? 'در حال ثبت...' : 'ایجاد کاربر و ثبت پورسانت'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
