import { locales, defaultLocale, type Locale } from '../../i18n';

/**
 * Detect user's preferred locale from browser settings
 */
export function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  const browserLocales = navigator.languages || [navigator.language];
  
  for (const browserLocale of browserLocales) {
    // Check exact match
    if (locales.includes(browserLocale as Locale)) {
      return browserLocale as Locale;
    }
    
    // Check language part only (e.g., 'en-US' -> 'en')
    const languageCode = browserLocale.split('-')[0] as Locale;
    if (locales.includes(languageCode)) {
      return languageCode;
    }
  }
  
  return defaultLocale;
}

/**
 * Get locale from URL pathname
 */
export function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split('/');
  const potentialLocale = segments[1] as Locale;
  
  if (locales.includes(potentialLocale)) {
    return potentialLocale;
  }
  
  return null;
}

/**
 * Remove locale from pathname
 */
export function removeLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (locale) {
    return pathname.replace(`/${locale}`, '') || '/';
  }
  return pathname;
}

/**
 * Add locale to pathname
 */
export function addLocaleToPathname(pathname: string, locale: Locale): string {
  const cleanPathname = removeLocaleFromPathname(pathname);
  return locale === defaultLocale ? cleanPathname : `/${locale}${cleanPathname}`;
}

/**
 * Store user's locale preference
 */
export function setLocalePreference(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred-locale', locale);
  }
}

/**
 * Get user's stored locale preference
 */
export function getLocalePreference(): Locale | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('preferred-locale') as Locale;
  return locales.includes(stored) ? stored : null;
}

/**
 * Get the best locale for the user
 */
export function getBestLocale(): Locale {
  // 1. Check stored preference
  const preferred = getLocalePreference();
  if (preferred) return preferred;
  
  // 2. Check browser locale
  return detectBrowserLocale();
}

/**
 * Format currency based on locale
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: Locale
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    // Fallback to English if locale is not supported
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
    }).format(amount);
  }
}

/**
 * Format date based on locale
 */
export function formatDate(
  date: Date | string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    // Fallback to English if locale is not supported
    return new Intl.DateTimeFormat('en', options).format(dateObj);
  }
}

/**
 * Format number based on locale
 */
export function formatNumber(
  number: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(number);
  } catch (error) {
    // Fallback to English if locale is not supported
    return new Intl.NumberFormat('en', options).format(number);
  }
}

/**
 * Format relative time based on locale
 */
export function formatRelativeTime(
  date: Date | string,
  locale: Locale
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  } catch (error) {
    // Fallback to simple date formatting
    return formatDate(dateObj, locale, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}
