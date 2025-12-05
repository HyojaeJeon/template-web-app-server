'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/solid';
import { COUNTRY_DATA } from '@/shared/utils/phoneValidation';
import { useTranslation } from '@/shared/i18n';

export default function CountrySelector({ 
  value, 
  onChange, 
  className = ''
}) {
  const { t } = useTranslation('auth');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedCountry = COUNTRY_DATA.find(c => c.code === value) || COUNTRY_DATA[0];

  const filteredCountries = COUNTRY_DATA.filter(country => {
    const search = searchTerm.toLowerCase();
    return (
      country.name.toLowerCase().includes(search) ||
      country.localName.includes(search) ||
      country.dialCode.includes(search) ||
      country.code.toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (country) => {
    onChange(country);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Tailwind 다크모드 클래스 직접 사용

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-12 flex items-center justify-between px-3 rounded-lg border text-sm
          transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          bg-white dark:bg-slate-800/50 border-gray-300 dark:border-slate-600/50 
          text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50
          ${className}
        `}
      >
        <div className="flex items-center space-x-2">
          <span className="text-base">{selectedCountry.flag}</span>
          <span className="font-medium text-sm">{selectedCountry.dialCode}</span>
        </div>
        <ChevronDownIcon 
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } text-gray-400 dark:text-slate-400`} 
        />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-72 rounded-xl border shadow-2xl bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 z-[99999]"
          style={{ zIndex: 99999 }}>
          {/* 검색 입력 */}
          <div className="p-3 border-b border-gray-200 dark:border-slate-700/50">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('signup.country_search')}
              className={`
                w-full px-3 py-2 rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 border-gray-300 dark:border-slate-600
              `}
            />
          </div>

          {/* 국가 목록 */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`
                    w-full px-3 py-2 flex items-center justify-between
                    transition-colors duration-150
                    ${country.code === selectedCountry.code 
                      ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-base">{country.flag}</span>
                    <div className="text-left">
                      <div className="font-medium">
                        {country.localName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        {country.name} {country.dialCode}
                      </div>
                    </div>
                  </div>
                  {country.code === selectedCountry.code && (
                    <CheckIcon className="h-4 w-4 text-indigo-400" />
                  )}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-slate-400">
                {t('signup.no_search_results')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}