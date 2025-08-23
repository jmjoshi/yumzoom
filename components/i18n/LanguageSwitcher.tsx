'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames, type Locale } from '../../i18n';
import { setLocalePreference, addLocaleToPathname } from '../../lib/i18n/utils';
import { Button } from '../ui/Button';
import { ChevronDown, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'buttons' | 'compact';
}

export function LanguageSwitcher({ className = '', variant = 'dropdown' }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocalePreference(newLocale);
    
    // Remove current locale from pathname and add new one
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';
    const newPath = addLocaleToPathname(pathWithoutLocale, newLocale);
    
    router.push(newPath);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  if (variant === 'buttons') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {locales.map((loc) => (
          <Button
            key={loc}
            variant={locale === loc ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleLocaleChange(loc)}
            className="text-xs"
          >
            {localeNames[loc]}
          </Button>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className="flex items-center gap-1 p-2"
          aria-label="Change language"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs uppercase">{locale}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>

        {isOpen && (
          <div 
            className="absolute top-full right-0 mt-1 min-w-[150px] bg-white border border-gray-200 rounded-md shadow-lg z-50"
            role="listbox"
            aria-label="Language options"
          >
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                  locale === loc ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
                role="option"
                aria-selected={locale === loc}
              >
                <span>{localeNames[loc]}</span>
                {locale === loc && <span className="text-blue-600">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2"
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="h-4 w-4" />
        <span>{localeNames[locale]}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 min-w-[200px] bg-white border border-gray-200 rounded-md shadow-lg z-50"
          role="listbox"
          aria-label="Language options"
        >
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 flex items-center justify-between ${
                locale === loc ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
              role="option"
              aria-selected={locale === loc}
            >
              <span>{localeNames[loc]}</span>
              {locale === loc && <span className="text-blue-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
