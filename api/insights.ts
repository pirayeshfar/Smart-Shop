import { GoogleGenAI, ThinkingLevel } from '@google/genai';

interface InsightsPayload {
  totalProducts?: number;
  salesCount?: number;
  totalRevenue?: number;
  totalExpenses?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (err: unknown): boolean => {
  const status = (err as { status?: number })?.status;
  return status === 429 || status === 503;
};

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'روش درخواست مجاز نیست.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        'کلید سرویس هوش مصنوعی (GEMINI_API_KEY) در تنظیمات محیطی سرور / Vercel تعریف نشده است.',
    });
    return;
  }

  let body: InsightsPayload = {};
  try {
    body =
      typeof req.body === 'string'
        ? (JSON.parse(req.body || '{}') as InsightsPayload)
        : ((req.body || {}) as InsightsPayload);
  } catch {
    res.status(400).json({ error: 'ساختار داده‌های ارسالی نامعتبر است.' });
    return;
  }

  const totalProducts = Number(body.totalProducts);
  const salesCount = Number(body.salesCount);
  const totalRevenue = Number(body.totalRevenue);
  const totalExpenses = Number(body.totalExpenses);

  if (
    !Number.isFinite(totalProducts) ||
    !Number.isFinite(salesCount) ||
    !Number.isFinite(totalRevenue) ||
    !Number.isFinite(totalExpenses)
  ) {
    res.status(400).json({ error: 'اطلاعات ارسالی برای تحلیل نامعتبر است.' });
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const dataSummary = `
    Shop Data Summary:
    - Total Products: ${totalProducts}
    - Sales Records: ${salesCount}
    - Total Revenue: ${totalRevenue}
    - Total Expenses: ${totalExpenses}
  `;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analyze this shop data and provide 3 actionable business insights in Persian. Data: ${dataSummary}`,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      res.status(200).json({ insight: response.text || 'تحلیلی دریافت نشد.' });
      return;
    } catch (err) {
      lastError = err;
      if (attempt < 2 && isRetryableError(err)) {
        await sleep(500 * Math.pow(2, attempt));
        continue;
      }
      break;
    }
  }

  console.error('Gemini API Error:', lastError);
  const status = (lastError as { status?: number })?.status;
  const message =
    status === 400 || status === 403
      ? 'کلید سرویس هوش مصنوعی معتبر نیست یا دسترسی لازم را ندارد. لطفاً تنظیمات کلید سرور را بررسی کنید.'
      : status === 429
        ? 'تعداد درخواست‌ها موقتاً از حد مجاز فراتر رفته است. لطفاً کمی بعد دوباره تلاش کنید.'
        : 'خطا در ارتباط با سرویس هوش مصنوعی. لطفاً دوباره تلاش کنید.';

  res
    .status(status && status >= 400 && status < 600 ? status : 500)
    .json({ error: message });
}
