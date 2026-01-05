
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BrainCircuit, Sparkles, Loader2, BarChart2 } from 'lucide-react';
import { Product, Sale, Expense } from '../types';

interface Props {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
}

const AIInsights: React.FC<Props> = ({ products, sales, expenses }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const generateInsights = async () => {
    // در Vercel حتما باید API_KEY را در قسمت Environment Variables تعریف کنید
    const apiKey = (import.meta as any).env?.VITE_API_KEY || (process as any).env?.API_KEY || '';
    
    if (!apiKey) {
      setInsight('خطا: کلید API یافت نشد. لطفا در تنظیمات Vercel متغیر API_KEY را تعریف کنید.');
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const dataSummary = `
        Shop Data:
        - Total Products: ${products.length}
        - Total Sales Count: ${sales.length}
        - Total Sales Value: ${sales.reduce((a, s) => a + s.totalAmount, 0)}
        - Total Expenses: ${expenses.reduce((a, e) => a + e.amount, 0)}
        - Top 3 Sold Products: ${Array.from(new Set(sales.map(s => s.productName))).slice(0, 3).join(', ')}
        - Low Stock Items: ${products.filter(p => p.stock <= p.reorderPoint).map(p => p.name).join(', ')}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Please analyze this shop's performance and provide 3 key business insights in Persian. Focus on inventory management and profitability. Use a professional and encouraging tone. Output format: Markdown. Data: ${dataSummary}`,
      });

      setInsight(response.text || 'خطا در دریافت تحلیل.');
    } catch (error) {
      console.error(error);
      setInsight('متاسفانه در حال حاضر امکان دریافت تحلیل هوشمند وجود ندارد. لطفاً تنظیمات کلید API را بررسی کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-indigo-200" size={28} />
            <h2 className="text-2xl font-bold">دستیار هوشمند کسب و کار</h2>
          </div>
          <p className="text-indigo-100 mb-6 leading-relaxed max-w-2xl">
            با استفاده از هوش مصنوعی جمینای، داده‌های فروشگاه شما تحلیل شده و پیشنهاداتی برای افزایش سودآوری و مدیریت بهتر موجودی ارائه می‌شود.
          </p>
          <button 
            onClick={generateInsights}
            disabled={loading}
            className="flex items-center gap-2 bg-white text-indigo-700 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit size={20} />}
            {loading ? 'در حال تحلیل داده‌ها...' : 'تحلیل هوشمند وضعیت فروشگاه'}
          </button>
        </div>
        <div className="absolute left-0 bottom-0 opacity-10 pointer-events-none">
          <BarChart2 size={240} />
        </div>
      </div>

      {insight && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="prose prose-slate prose-lg max-w-none text-right">
            <div className="flex items-center gap-2 mb-6 text-indigo-600 font-bold border-b pb-4">
              <BrainCircuit size={20} />
              <span>نتایج تحلیل هوشمند جمینای:</span>
            </div>
            <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {insight}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
