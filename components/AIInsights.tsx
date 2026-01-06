
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
    setLoading(true);
    try {
      // Always initialize GoogleGenAI with process.env.API_KEY directly as per guidelines.
      // This also resolves the 'Property env does not exist on type ImportMeta' error.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const dataSummary = `
        Shop Data Summary:
        - Total Products: ${products.length}
        - Sales Records: ${sales.length}
        - Total Revenue: ${sales.reduce((a, s) => a + s.totalAmount, 0)}
        - Total Expenses: ${expenses.reduce((a, e) => a + e.amount, 0)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this shop data and provide 3 actionable business insights in Persian. Data: ${dataSummary}`,
      });

      // Extract generated text using the .text property (not a method) from the response.
      setInsight(response.text || 'تحلیلی دریافت نشد.');
    } catch (error) {
      console.error('Gemini API Error:', error);
      setInsight('خطا در ارتباط با هوش مصنوعی. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <BrainCircuit className="text-indigo-200" size={28} />
            <Sparkles className="text-indigo-200" size={28} />
            <h2 className="text-2xl font-bold">دستیار هوشمند کسب و کار</h2>
          </div>
          <p className="text-indigo-100 mb-6 leading-relaxed max-w-2xl">
            با استفاده از هوش مصنوعی جمینای، داده‌های فروشگاه خود را تحلیل کرده و راهکارهای عملی برای رشد کسب‌وکار دریافت کنید.
          </p>
          <button 
            onClick={generateInsights}
            disabled={loading}
            className="flex items-center gap-2 bg-white text-indigo-700 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all disabled:opacity-70 shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit size={20} />}
            {loading ? 'در حال تحلیل داده‌ها...' : 'دریافت تحلیل هوشمند'}
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
              <span>نتایج تحلیل هوشمند:</span>
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
