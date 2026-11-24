import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const getPortFromArgs = (): number | null => {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--port=')) {
      const val = Number(arg.slice('--port='.length));
      if (Number.isFinite(val) && val > 0) return val;
    } else if ((arg === '--port' || arg === '-p') && args[i + 1]) {
      const val = Number(args[i + 1]);
      if (Number.isFinite(val) && val > 0) return val;
    }
  }
  return null;
};

const PORT = getPortFromArgs() || Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (err: unknown): boolean => {
  const status = (err as { status?: number })?.status;
  return status === 429 || status === 503;
};

interface InsightsPayload {
  totalProducts?: number;
  salesCount?: number;
  totalRevenue?: number;
  totalExpenses?: number;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/insights', async (req: Request, res: Response) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(500).json({
        error: 'کلید سرویس هوش مصنوعی روی سرور تنظیم نشده است. لطفاً تنظیمات Secrets را بررسی کنید.',
      });
      return;
    }

    const body = (req.body || {}) as InsightsPayload;
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

        res.json({ insight: response.text || 'تحلیلی دریافت نشد.' });
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
        ? 'کلید سرویس هوش مصنوعی معتبر نیست یا دسترسی لازم را ندارد. لطفاً تنظیمات Secrets را بررسی کنید.'
        : status === 429
          ? 'تعداد درخواست‌ها موقتاً از حد مجاز فراتر رفته است. لطفاً کمی بعد دوباره تلاش کنید.'
          : 'خطا در ارتباط با سرویس هوش مصنوعی. لطفاً دوباره تلاش کنید.';

    res.status(status && status >= 400 && status < 600 ? status : 500).json({ error: message });
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(distDir, 'index.html'));
        return;
      }
      next();
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
