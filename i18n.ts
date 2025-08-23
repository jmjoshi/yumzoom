import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'hi', 'ru'] as const;
export const defaultLocale = 'en' as const;

export type Locale = typeof locales[number];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    locale: locale as string,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});

export const localeNames = {
  en: 'English',
  es: 'Español',
  fr: 'Français', 
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  ar: 'العربية',
  hi: 'हिन्दी',
  ru: 'Русский'
} as const;

export const rtlLocales = ['ar'];

export const currencyByLocale = {
  en: 'USD',
  es: 'EUR',
  fr: 'EUR',
  de: 'EUR',
  it: 'EUR',
  pt: 'EUR',
  ja: 'JPY',
  ko: 'KRW',
  zh: 'CNY',
  ar: 'AED',
  hi: 'INR',
  ru: 'RUB'
} as const;
