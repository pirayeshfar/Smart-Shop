export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

const div = (a: number, b: number) => ~~(a / b);
const mod = (a: number, b: number) => a - ~~(a / b) * b;

export const toPersianDigits = (input: string | number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/\d/g, (d) => persianDigits[Number(d)]);
};

export const gregorianToJalali = (gy: number, gm: number, gd: number): JalaliDate => {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    div(gy2 + 3, 4) -
    div(gy2 + 99, 100) +
    div(gy2 + 399, 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * div(days, 12053);
  days = mod(days, 12053);
  jy += 4 * div(days, 1461);
  days = mod(days, 1461);
  if (days > 365) {
    jy += div(days - 1, 365);
    days = mod(days - 1, 365);
  }
  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? mod(days, 31) : mod(days - 186, 30));
  return { jy, jm, jd };
};

export const jalaliToGregorian = (
  jy: number,
  jm: number,
  jd: number
): { gy: number; gm: number; gd: number } => {
  let jyAdj = jy + 1595;
  let days =
    -355668 +
    365 * jyAdj +
    div(jyAdj, 33) * 8 +
    div(mod(jyAdj, 33) + 3, 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * div(days, 146097);
  days = mod(days, 146097);
  if (days > 36524) {
    gy += 100 * div(--days, 36524);
    days = mod(days, 36524);
    if (days >= 365) days++;
  }
  gy += 4 * div(days, 1461);
  days = mod(days, 1461);
  if (days > 365) {
    gy += div(days - 1, 365);
    days = mod(days - 1, 365);
  }
  let gd = days + 1;
  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  for (; gm < 13 && gd > sal_a[gm]; gm++) {
    gd -= sal_a[gm];
  }
  return { gy, gm, gd };
};

export const isJalaliLeapYear = (jy: number): boolean => {
  const g = jalaliToGregorian(jy, 12, 30);
  const back = gregorianToJalali(g.gy, g.gm, g.gd);
  return back.jy === jy && back.jm === 12 && back.jd === 30;
};

export const getJalaliMonthLength = (jy: number, jm: number): number => {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
};

export const getJalaliFromDate = (date: Date): JalaliDate => {
  return gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
};

export const getJalaliMonthRange = (
  jy: number,
  jm: number
): { startDate: Date; endDate: Date; monthLength: number } => {
  const monthLength = getJalaliMonthLength(jy, jm);
  const startG = jalaliToGregorian(jy, jm, 1);
  const endG = jalaliToGregorian(jy, jm, monthLength);
  return {
    startDate: new Date(startG.gy, startG.gm - 1, startG.gd, 0, 0, 0, 0),
    endDate: new Date(endG.gy, endG.gm - 1, endG.gd, 23, 59, 59, 999),
    monthLength,
  };
};

export const shiftJalaliMonth = (
  jy: number,
  jm: number,
  deltaMonths: number
): { jy: number; jm: number } => {
  const totalMonths = jy * 12 + (jm - 1) + deltaMonths;
  const newJy = Math.floor(totalMonths / 12);
  const newJm = (((totalMonths % 12) + 12) % 12) + 1;
  return { jy: newJy, jm: newJm };
};

export const toJalaliMonthKey = (jy: number, jm: number): string => {
  return `${jy}-${String(jm).padStart(2, '0')}`;
};

export const parseJalaliMonthKey = (key: string): { jy: number; jm: number } | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return null;
  const jy = Number(match[1]);
  const jm = Number(match[2]);
  if (!Number.isFinite(jy) || jm < 1 || jm > 12) return null;
  return { jy, jm };
};

export const formatJalaliMonthLabel = (jy: number, jm: number): string => {
  const monthName = PERSIAN_MONTHS[jm - 1] || '';
  return `${monthName} ${toPersianDigits(jy)}`;
};
