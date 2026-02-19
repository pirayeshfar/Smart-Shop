
import React, { useState } from 'react';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { Expense } from '../types';
import { DB } from '../services/db';

interface Props {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const ExpenseManager: React.FC<Props> = ({ expenses, setExpenses }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newExpense: Expense = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description,
      amount
    };
    try {
      await DB.addExpense(newExpense);
      setExpenses([newExpense, ...expenses]);
      setDescription('');
      setAmount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('آیا از حذف این هزینه اطمینان دارید؟')) {
      await DB.deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl shadow-sm border sticky top-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Wallet size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">ثبت هزینه جدید</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">شرح هزینه</label>
              <textarea 
                required
                className="w-full px-4 py-2 border rounded-xl outline-none h-24"
                placeholder="مثلاً: اجاره مغازه، قبض برق..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">مبلغ (ریال)</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-2 border rounded-xl outline-none"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
              />
            </div>
            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 disabled:opacity-50"
            >
              {isSaving ? 'در حال ثبت...' : 'ذخیره هزینه'}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-slate-800">لیست هزینه‌ها</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">تاریخ</th>
                  <th className="px-6 py-4">شرح</th>
                  <th className="px-6 py-4">مبلغ</th>
                  <th className="px-6 py-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-500">{new Date(expense.date).toLocaleDateString('fa-IR')}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{expense.description}</td>
                    <td className="px-6 py-4 font-bold text-rose-600">{new Intl.NumberFormat('fa-IR').format(expense.amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDelete(expense.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseManager;
