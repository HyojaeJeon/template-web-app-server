'use client';

/**
 * BusinessRegistrationInput Component - Business Registration with Country Selector
 * TaxIdInput과 동일한 디자인 패턴 적용
 *
 * Features:
 * - 한 줄 레이아웃: 국가 선택 버튼 (왼쪽) + 사업자등록번호 입력 (오른쪽)
 * - Portal 기반 플로팅 드롭다운
 * - Real-time validation with checksum verification
 * - Multilingual error messages
 * - Auto-formatting based on country
 * - Support for Vietnam GCNĐKKD, Korea 사업자등록번호, US EIN, Japan 法人番号, Singapore UEN
 */

import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/shared/i18n';
import {
  BUSINESS_REG_COUNTRIES,
  validateBusinessRegistration,
  getBusinessRegPlaceholder,
} from '@/shared/utils/businessRegistrationValidation';

// 국가 목록 (Local 우선)
const COUNTRIES = [
  { code: 'VN', name: 'Vietnam', nameKo: 'Local', flag: '🇻🇳', regName: 'GCNĐKKD' },
  { code: 'KR', name: 'South Korea', nameKo: '한국', flag: '🇰🇷', regName: '사업자등록번호' },
  { code: 'US', name: 'United States', nameKo: '미국', flag: '🇺🇸', regName: 'EIN' },
  { code: 'JP', name: 'Japan', nameKo: '일본', flag: '🇯🇵', regName: '法人番号' },
  { code: 'SG', name: 'Singapore', nameKo: '싱가포르', flag: '🇸🇬', regName: 'UEN' },
];

const BusinessRegistrationInput = ({
  value = '',
  onChange,
  onCountryChange,
  defaultCountry = 'VN',
  placeholder,
  error,
  required = false,
  disabled = false,
  label,
  helperText,
  validateOnBlur = true,
  validateOnChange = true,
  className = '',
}) => {
  const { t } = useTranslation('validation');
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find(c => c.code === defaultCountry) || COUNTRIES[0]
  );
  const [regValue, setRegValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, openAbove: false });
  const [validationError, setValidationError] = useState(null);
  const [isValid, setIsValid] = useState(false);

  const selectRef = useRef(null);
  const buttonRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsRef = useRef([]);
  const generatedId = useId();

  // 컴포넌트 마운트 시 기본 국가 코드 알림
  useEffect(() => {
    if (onCountryChange) {
      onCountryChange(selectedCountry.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 초기 마운트 시에만 실행

  // 외부 value 변경 감지
  useEffect(() => {
    if (value !== regValue) {
      setRegValue(value || '');
    }
  }, [value]);

  // 검색 필터링
  const filteredCountries = searchTerm
    ? COUNTRIES.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.nameKo.includes(searchTerm) ||
        country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.regName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : COUNTRIES;

  // 에러 메시지 가져오기
  const getErrorMessage = (errorKey) => {
    if (!errorKey) return null;

    const translated = t(errorKey, { defaultValue: '' });
    if (translated && translated !== errorKey) {
      return translated;
    }

    // Fallback 메시지
    const fallbackMessages = {
      'businessReg.required': '사업자등록번호를 입력해주세요',
      'businessReg.unsupportedCountry': '지원하지 않는 국가입니다',
      'businessReg.vietnam.invalidLength': 'Local 사업자등록번호는 10자리 또는 13자리여야 합니다',
      'businessReg.vietnam.invalidProvinceCode': '유효하지 않은 지역 코드입니다',
      'businessReg.vietnam.invalidChecksum': '유효하지 않은 사업자등록번호입니다 - 확인해주세요',
      'businessReg.vietnam.invalidSubsidiaryCode': '유효하지 않은 자회사 코드입니다 (001-999)',
      'businessReg.korea.invalidLength': '한국 사업자등록번호는 10자리여야 합니다',
      'businessReg.korea.invalidChecksum': '유효하지 않은 사업자등록번호입니다 - 확인해주세요',
      'businessReg.us.invalidLength': '미국 EIN은 9자리여야 합니다',
      'businessReg.us.invalidPrefix': '유효하지 않은 EIN 접두사입니다',
      'businessReg.japan.invalidLength': '일본 법인번호는 13자리여야 합니다',
      'businessReg.japan.invalidChecksum': '유효하지 않은 법인번호입니다',
      'businessReg.singapore.invalidFormat': '유효하지 않은 싱가포르 UEN 형식입니다',
    };

    return fallbackMessages[errorKey] || errorKey;
  };

  // 사업자등록번호 유효성 검사
  const validateValue = (val, countryCode = selectedCountry.code) => {
    if (!val || val.trim() === '') {
      setValidationError(null);
      setIsValid(false);
      return true;
    }

    const result = validateBusinessRegistration(val, countryCode);

    if (!result.valid) {
      const errorMsg = getErrorMessage(result.errorKey);
      setValidationError(errorMsg);
      setIsValid(false);
      return false;
    }

    setValidationError(null);
    setIsValid(true);
    return true;
  };

  // 국가 선택 핸들러
  const handleCountrySelect = (country, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchTerm('');

    // 국가 코드 변경 알림
    if (onCountryChange) {
      onCountryChange(country.code);
    }

    // 사업자등록번호가 있으면 새 국가 코드로 재검증
    if (regValue) {
      validateValue(regValue, country.code);
    }
  };

  // 사업자등록번호 입력 핸들러 - 입력 시 즉시 유효성 검사
  const handleRegChange = (e) => {
    const input = e.target.value;
    setRegValue(input);

    if (onChange) {
      onChange(input);
    }

    // 입력값이 있으면 즉시 유효성 검사 실행
    if (validateOnChange) {
      if (input && input.trim()) {
        validateValue(input);
      } else {
        // 빈 값이면 에러/유효 상태 초기화
        setValidationError(null);
        setIsValid(false);
      }
    }
  };

  // 블러 핸들러
  const handleBlur = () => {
    setIsFocused(false);

    if (validateOnBlur && regValue) {
      validateValue(regValue);
    }
  };

  // 드롭다운 위치 업데이트 (화면 위치에 따라 상단/하단 결정)
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 320; // max-h-80 = 320px
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // 하단 공간이 부족하고 상단 공간이 더 넉넉한 경우 위로 열기
      const openAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownPosition({
        top: openAbove
          ? rect.top + window.scrollY - dropdownHeight - 4 // 위로 열기
          : rect.bottom + window.scrollY + 4, // 아래로 열기
        left: rect.left + window.scrollX,
        width: rect.width,
        openAbove
      });
    }
  };

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideTrigger = selectRef.current && selectRef.current.contains(e.target);
      const clickedInsidePortal = e.target.closest('[data-businessreg-select-portal="true"]');

      if (!clickedInsideTrigger && !clickedInsidePortal) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 드롭다운 위치 업데이트 (스크롤/리사이즈)
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();

      const handlePositionUpdate = () => {
        updateDropdownPosition();
      };

      window.addEventListener('scroll', handlePositionUpdate, true);
      window.addEventListener('resize', handlePositionUpdate);

      return () => {
        window.removeEventListener('scroll', handlePositionUpdate, true);
        window.removeEventListener('resize', handlePositionUpdate);
      };
    }
  }, [isOpen]);

  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev =>
            prev < filteredCountries.length - 1 ? prev + 1 : prev
          );
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        }
        break;

      case 'Enter':
        if (isOpen && highlightedIndex >= 0) {
          e.preventDefault();
          handleCountrySelect(filteredCountries[highlightedIndex]);
        }
        break;

      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          setSearchTerm('');
        }
        break;

      default:
        break;
    }
  };

  // 하이라이트 항목 스크롤
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [highlightedIndex]);

  // 국가 정보
  const countryData = BUSINESS_REG_COUNTRIES[selectedCountry.code];
  const displayError = error || validationError;

  return (
    <div className={`flex flex-col gap-2 ${className}`} ref={selectRef}>
      {/* 라벨 */}
      {label && (
        <label
          htmlFor={generatedId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* 한 줄 레이아웃: 국가 선택 + 사업자등록번호 입력 */}
      <div className="flex gap-2 items-center">
        {/* 국가 선택 버튼 (왼쪽) */}
        <button
          ref={buttonRef}
          type="button"
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border whitespace-nowrap
            transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${disabled
              ? 'text-neutral-400 cursor-not-allowed border-neutral-300'
              : displayError
                ? 'text-rose-500 border-rose-400 bg-rose-50/50 dark:bg-rose-900/20'
                : isOpen
                  ? 'text-[#2AC1BC] border-[#2AC1BC] ring-2 ring-[#2AC1BC]/20 shadow-lg shadow-[#2AC1BC]/15'
                  : 'text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-gray-600 hover:border-[#2AC1BC] hover:text-[#2AC1BC]'
            }
          `}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) {
              setIsOpen(!isOpen);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-sm font-medium">{t(`countries.${selectedCountry.code}`, { defaultValue: selectedCountry.nameKo })}</span>
          <span className="text-xs" aria-hidden="true">
            {isOpen ? '▲' : '▼'}
          </span>
        </button>

        {/* 사업자등록번호 입력 필드 (오른쪽) */}
        <div className="flex-1">
          <input
            id={generatedId}
            type="text"
            value={regValue}
            onChange={handleRegChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder={placeholder || getBusinessRegPlaceholder(selectedCountry.code)}
            disabled={disabled}
            required={required}
            className={`
              w-full px-3 py-2 border rounded-lg
              focus:ring-2 focus:ring-vietnam-mint
              dark:bg-gray-700 dark:text-white
              disabled:opacity-50 disabled:cursor-not-allowed
              ${displayError
                ? 'border-red-500 dark:border-red-400'
                : isValid && regValue
                  ? 'border-emerald-500 dark:border-emerald-400'
                  : 'border-gray-300 dark:border-gray-600'
              }
            `}
            aria-invalid={displayError ? 'true' : 'false'}
            aria-describedby={
              displayError ? `${generatedId}-error` :
              helperText ? `${generatedId}-helper` : undefined
            }
          />
        </div>
      </div>

      {/* 국가 선택 드롭다운 (Portal) */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          className={`fixed z-[9999] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-auto ${
            dropdownPosition.openAbove ? 'flex flex-col-reverse' : ''
          }`}
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: '350px'
          }}
          data-businessreg-select-portal="true"
          role="listbox"
        >
          {/* 검색 입력 */}
          <div className="sticky top-0 p-2 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 z-10">
            <input
              ref={searchInputRef}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#2AC1BC]"
              placeholder={t('businessReg.searchCountry', { defaultValue: '국가 검색...' })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {/* 국가 목록 */}
          <div className="py-1">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                {t('businessReg.noCountryFound', { defaultValue: '검색 결과가 없습니다' })}
              </div>
            ) : (
              filteredCountries.map((country, index) => {
                const isSelected = selectedCountry.code === country.code;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={country.code}
                    type="button"
                    ref={el => optionsRef.current[index] = el}
                    className={`
                      w-full px-4 py-2 text-left cursor-pointer text-sm flex items-center gap-3
                      ${isSelected ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] dark:bg-[#2AC1BC]/20' : 'text-gray-900 dark:text-gray-100'}
                      ${isHighlighted ? 'bg-gray-100 dark:bg-gray-600' : ''}
                      hover:bg-gray-100 dark:hover:bg-gray-600
                      transition-colors duration-150
                    `}
                    onClick={(e) => handleCountrySelect(country, e)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <div className="flex-1">
                      <div className="font-medium">{t(`countries.${country.code}`, { defaultValue: country.nameKo })}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{country.name}</div>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">{country.regName}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 에러 메시지 */}
      {displayError && (
        <p className="text-sm text-red-600 dark:text-red-400" id={`${generatedId}-error`} role="alert">
          {displayError}
        </p>
      )}

      {/* 유효성 검사 성공 표시 */}
      {!displayError && isValid && regValue && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          ✓ {t('businessReg.valid', { defaultValue: '유효한 사업자등록번호입니다' })}
        </p>
      )}

      {/* 헬퍼 텍스트 + 형식 가이드 */}
      {!displayError && !isValid && (
        <p id={`${generatedId}-helper`} className="text-xs text-gray-500 dark:text-gray-500">
          {helperText || `${t('businessReg.formatHint', { defaultValue: '형식' })}: ${countryData?.format || ''}`}
        </p>
      )}
    </div>
  );
};

export default BusinessRegistrationInput;
