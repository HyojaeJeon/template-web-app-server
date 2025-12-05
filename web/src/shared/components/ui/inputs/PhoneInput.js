/**
 * PhoneInput 컴포넌트 - TextInput 스타일 통일 v3.0
 *
 * TextInput과 동일한 디자인 시스템 적용:
 * - 글래스모피즘 스타일 (glass morphism)
 * - 플로팅 라벨 시스템
 * - 터치 최적화 (44px 최소 높이)
 * - 국가별 상세 전화번호 유효성 검사 (Local, 한국 등)
 * - 통신사별 번호 검증 (Local)
 * - 입력 제한 및 자동 포맷팅
 * - Portal 기반 드롭다운
 * - 키보드 네비게이션
 *
 * @version 3.0.0
 * @updated 2025-11-07 - 상세 국가별 유효성 검사 추가
 */

'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { parsePhoneNumber, getCountryCallingCode } from 'libphonenumber-js';

// 주요 국가 목록 (Local, 한국 우선)
const COUNTRIES = [
  { code: 'VN', name: 'Vietnam', nameKo: 'Local', flag: '🇻🇳' },
  { code: 'KR', name: 'South Korea', nameKo: '한국', flag: '🇰🇷' },
  { code: 'US', name: 'United States', nameKo: '미국', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', nameKo: '영국', flag: '🇬🇧' },
  { code: 'CN', name: 'China', nameKo: '중국', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', nameKo: '일본', flag: '🇯🇵' },
  { code: 'TH', name: 'Thailand', nameKo: '태국', flag: '🇹🇭' },
  { code: 'SG', name: 'Singapore', nameKo: '싱가포르', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', nameKo: '말레이시아', flag: '🇲🇾' },
  { code: 'PH', name: 'Philippines', nameKo: '필리핀', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', nameKo: '인도네시아', flag: '🇮🇩' },
  { code: 'IN', name: 'India', nameKo: '인도', flag: '🇮🇳' },
  { code: 'AU', name: 'Australia', nameKo: '호주', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', nameKo: '캐나다', flag: '🇨🇦' },
  { code: 'FR', name: 'France', nameKo: '프랑스', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', nameKo: '독일', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', nameKo: '이탈리아', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', nameKo: '스페인', flag: '🇪🇸' },
  { code: 'BR', name: 'Brazil', nameKo: '브라질', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', nameKo: '멕시코', flag: '🇲🇽' },
];

/**
 * 국가별 전화번호 최대 입력 길이 (0 제거 후 길이)
 * 주의: UI에 국가번호(+XX)가 이미 표시되므로, 사용자는 로컬 번호만 입력
 *       맨 앞 0은 자동으로 제거됨
 */
const PHONE_MAX_LENGTH = {
  VN: 9,   // Local: 9자리 (971562858, 0 제거 후)
  KR: 10,  // 한국: 10자리 (1012345678, 0 제거 후)
  US: 10,  // 미국: 10자리
  GB: 10,  // 영국: 10자리
  CN: 11,  // 중국: 11자리
  JP: 10,  // 일본: 10자리 (9012345678, 0 제거 후)
  TH: 9,   // 태국: 9자리 (0 제거 후)
  SG: 8,   // 싱가포르: 8자리
  MY: 9,   // 말레이시아: 9자리 (0 제거 후)
  PH: 10,  // 필리핀: 10자리
  ID: 11,  // 인도네시아: 11자리 (0 제거 후)
  IN: 10,  // 인도: 10자리
  AU: 9,   // 호주: 9자리 (0 제거 후)
  CA: 10,  // 캐나다: 10자리
  FR: 9,   // 프랑스: 9자리 (0 제거 후)
  DE: 10,  // 독일: 10자리 (0 제거 후)
  IT: 10,  // 이탈리아: 10자리
  ES: 9,   // 스페인: 9자리
  BR: 11,  // 브라질: 11자리
  MX: 10,  // 멕시코: 10자리
};

/**
 * 국가별 전화번호 형식 예시 (helper text용)
 * 주의: 국가번호(+XX)는 UI에 이미 표시되므로, 0 없는 로컬 번호만 입력
 *       사용자가 0을 입력하면 자동으로 제거됨
 */
const PHONE_FORMAT_EXAMPLES = {
  VN: '예: 971 562 858 (Viettel: 32-39, 96-98 | Vinaphone: 81-85, 91, 94) *0은 자동 제거',
  KR: '예: 10 1234 5678 (모바일: 10, 11, 16-19) *0은 자동 제거',
  US: '예: 555 123 4567',
  GB: '예: 7400 123456',
  CN: '예: 138 0000 0000',
  JP: '예: 90 1234 5678',
  TH: '예: 81 234 5678',
  SG: '예: 9123 4567',
  MY: '예: 12 345 6789',
  PH: '예: 917 123 4567',
  ID: '예: 812 3456 7890',
  IN: '예: 98765 43210',
  AU: '예: 412 345 678',
  CA: '예: 416 555 0123',
  FR: '예: 6 12 34 56 78',
  DE: '예: 151 23456789',
  IT: '예: 333 1234567',
  ES: '예: 612 34 56 78',
  BR: '예: 11 98765 4321',
  MX: '예: 55 1234 5678',
};

/**
 * Local 전화번호 유효성 검사 유틸리티
 *
 * Local 전화번호 형식 (2025년 기준):
 * - 총 9자리 (국가번호 +84 제외, 로컬 0 제외)
 * - 사용자 입력: 0971562858 → 자동으로 0 제거 → 971562858
 * - UI 표시: 🇻🇳 +84 | 971562858
 * - 서버 전송: +84971562858
 * - 모바일: 32-39, 52, 56, 58, 59, 70, 76-79, 81-85, 86-89, 90-94, 96-99
 * - 고정전화: 지역번호 + 7-8자리
 *
 * @param {string} phoneNumber - 검증할 전화번호 (0 제거된 상태)
 * @returns {{isValid: boolean, error: string|null, type: string|null, operator: string|null}}
 */
const validateVietnamPhone = (phoneNumber) => {
  // 숫자만 추출
  const digits = phoneNumber.replace(/\D/g, '');

  // 빈 입력은 검증 통과 (선택 필드)
  if (digits.length === 0) {
    return {
      isValid: true,
      error: null,
      type: null,
      operator: null
    };
  }

  // 길이 체크 (9자리 고정)
  if (digits.length < 9) {
    return {
      isValid: false,
      error: `${9 - digits.length}자리 더 입력해주세요 (총 9자리 필요)`,
      type: null,
      operator: null
    };
  }

  if (digits.length > 9) {
    return {
      isValid: false,
      error: '9자리만 입력 가능합니다',
      type: null,
      operator: null
    };
  }

  // 모바일 번호 검증 (2025년 기준 - 통신사별, 0 없음)
  const mobileOperators = [
    // Viettel (최대 점유율 54.2%)
    { pattern: /^(32|33|34|35|36|37|38|39)[0-9]{7}$/, name: 'Viettel', prefixes: '32-39' },
    { pattern: /^(96|97|98)[0-9]{7}$/, name: 'Viettel', prefixes: '96-98' },

    // Vinaphone (23.1%)
    { pattern: /^(81|82|83|84|85)[0-9]{7}$/, name: 'Vinaphone', prefixes: '81-85' },
    { pattern: /^(91|94)[0-9]{7}$/, name: 'Vinaphone', prefixes: '91, 94' },

    // MobiFone (18.6%)
    { pattern: /^70[0-9]{7}$/, name: 'MobiFone', prefixes: '70' },
    { pattern: /^(76|77|78|79)[0-9]{7}$/, name: 'MobiFone', prefixes: '76-79' },
    { pattern: /^(89|90|93)[0-9]{7}$/, name: 'MobiFone', prefixes: '89, 90, 93' },

    // Vietnamobile
    { pattern: /^(52|56|58|59)[0-9]{7}$/, name: 'Vietnamobile', prefixes: '52, 56, 58, 59' },
    { pattern: /^92[0-9]{7}$/, name: 'Vietnamobile', prefixes: '92' },

    // Gmobile
    { pattern: /^99[0-9]{7}$/, name: 'Gmobile', prefixes: '99' },

    // Reddi (Gtel Mobile)
    { pattern: /^86[0-9]{7}$/, name: 'Reddi', prefixes: '86' },

    // Itelecom (itel)
    { pattern: /^87[0-9]{7}$/, name: 'Itelecom', prefixes: '87' },

    // Indochina Telecom (iTel)
    { pattern: /^88[0-9]{7}$/, name: 'Indochina', prefixes: '88' },
  ];

  for (const { pattern, name, prefixes } of mobileOperators) {
    if (pattern.test(digits)) {
      return {
        isValid: true,
        error: null,
        type: 'mobile',
        operator: `${name} (${prefixes})`
      };
    }
  }

  // 고정전화 검증 (지역번호 + 번호, 0 없음)
  const landlinePatterns = [
    /^(2[0-9])[0-9]{8}$/,  // 하노이(24), 호치민(28) 등 주요 도시 (2x)
    /^(2[0-9])[0-9]{7}$/,  // 일부 지역
  ];

  const isLandline = landlinePatterns.some(pattern => pattern.test(digits));

  if (isLandline) {
    return {
      isValid: true,
      error: null,
      type: 'landline',
      operator: null
    };
  }

  // 모든 패턴 불일치
  return {
    isValid: false,
    error: '유효하지 않은 Local 전화번호입니다. 통신사 번호를 확인해주세요.',
    type: null,
    operator: null
  };
};

/**
 * 한국 전화번호 유효성 검사
 *
 * 한국 전화번호 형식 (2025년 기준):
 * - 총 9-10자리 (국가번호 +82 제외, 로컬 0 제외)
 * - 사용자 입력: 01012345678 → 자동으로 0 제거 → 1012345678
 * - UI 표시: 🇰🇷 +82 | 1012345678
 * - 서버 전송: +821012345678
 * - 모바일: 10, 11, 16-19 (9-10자리, 0 제외)
 * - 고정전화: 지역번호 2, 31-33, 41-44, 51-55, 61-64 (8-10자리, 0 제외)
 *
 * @param {string} phoneNumber - 검증할 전화번호 (0 제거된 상태)
 * @returns {{isValid: boolean, error: string|null, type: string|null}}
 */
const validateKoreanPhone = (phoneNumber) => {
  const digits = phoneNumber.replace(/\D/g, '');

  // 빈 입력은 검증 통과
  if (digits.length === 0) {
    return {
      isValid: true,
      error: null,
      type: null
    };
  }

  // 한국은 0 제거 후 9-10자리
  if (digits.length < 9) {
    return {
      isValid: false,
      error: `${9 - digits.length}자리 더 입력해주세요 (총 9-10자리 필요)`,
      type: null
    };
  }

  if (digits.length > 10) {
    return {
      isValid: false,
      error: '10자리만 입력 가능합니다',
      type: null
    };
  }

  // 모바일: 10, 11, 16, 17, 18, 19 (0 제거 후 9-10자리)
  const mobilePattern = /^(10|11|16|17|18|19)[0-9]{7,8}$/;

  // 고정전화: 지역번호 + 번호 (0 제거 후 8-10자리)
  const landlinePattern = /^(2|3[1-3]|4[1-4]|5[1-5]|6[1-4])[0-9]{7,8}$/;

  if (mobilePattern.test(digits)) {
    return {
      isValid: true,
      error: null,
      type: 'mobile'
    };
  }

  if (landlinePattern.test(digits)) {
    return {
      isValid: true,
      error: null,
      type: 'landline'
    };
  }

  return {
    isValid: false,
    error: '유효하지 않은 한국 전화번호입니다. 통신사/지역번호를 확인해주세요.',
    type: null
  };
};

/**
 * 통합 전화번호 유효성 검사
 *
 * @param {string} phoneNumber - 검증할 전화번호 (국가번호 제외)
 * @param {string} countryCode - 국가 코드 (VN, KR 등)
 * @returns {{isValid: boolean, error: string|null, type: string|null, operator: string|null}}
 */
const validatePhoneByCountry = (phoneNumber, countryCode) => {
  const digits = phoneNumber.replace(/\D/g, '');

  // 빈 입력 허용
  if (!digits) {
    return {
      isValid: true,
      error: null,
      type: null,
      operator: null
    };
  }

  switch (countryCode) {
    case 'VN':
      return validateVietnamPhone(phoneNumber);

    case 'KR':
      return validateKoreanPhone(phoneNumber);

    // 다른 국가는 기본 길이 검증만 수행
    default: {
      const maxLength = PHONE_MAX_LENGTH[countryCode] || 15;

      if (digits.length < 8) {
        return {
          isValid: false,
          error: '최소 8자리 이상 입력해주세요',
          type: null,
          operator: null
        };
      }

      if (digits.length > maxLength) {
        return {
          isValid: false,
          error: `최대 ${maxLength}자리까지 입력 가능합니다`,
          type: null,
          operator: null
        };
      }

      return {
        isValid: true,
        error: null,
        type: 'unknown',
        operator: null
      };
    }
  }
};

/**
 * PhoneInput 컴포넌트
 */
export default function PhoneInput({
  value = '',
  onChange,
  onCountryChange, // 국가 코드 변경 콜백 추가
  defaultCountry = 'VN',
  placeholder = '',
  error,
  required = false,
  disabled = false,
  label,
  helperText,
  className = '',
}) {
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find(c => c.code === defaultCountry) || COUNTRIES[0]
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [validationError, setValidationError] = useState(null);
  const [phoneInfo, setPhoneInfo] = useState(null); // 전화번호 정보 (통신사 등)

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

  // 초기값 파싱
  useEffect(() => {
    if (value) {
      try {
        const parsed = parsePhoneNumber(value);
        if (parsed) {
          const country = COUNTRIES.find(c => c.code === parsed.country);
          if (country) {
            setSelectedCountry(country);
          }
          // 국가번호를 제외한 전화번호만 저장 (맨 앞 0은 사용자가 볼 수 있도록 유지)
          setPhoneNumber(parsed.nationalNumber);

          // 초기값 유효성 검사
          const validation = validatePhoneByCountry(parsed.nationalNumber, parsed.country);
          if (!validation.isValid) {
            setValidationError(validation.error);
          } else {
            setPhoneInfo(validation);
          }
        }
      } catch (e) {
        // 파싱 실패 시 그대로 표시 (국가번호 없는 경우)
        const numbersOnly = value.replace(/\D/g, '');
        setPhoneNumber(numbersOnly);
      }
    }
  }, [value]);

  // 검색 필터링
  const filteredCountries = searchTerm
    ? COUNTRIES.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.nameKo.includes(searchTerm) ||
        country.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : COUNTRIES;

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

    // 전화번호가 있으면 새 국가 코드로 재검증
    if (phoneNumber) {
      const validation = validatePhoneByCountry(phoneNumber, country.code);

      if (!validation.isValid) {
        setValidationError(validation.error);
        setPhoneInfo(null);
      } else {
        setValidationError(null);
        setPhoneInfo(validation);
      }

      // ⚠️ 순수 전화번호만 전달 (국가번호 제외)
      // 서버 제출 시에만 국가번호를 붙여서 전송
      if (onChange) {
        onChange(phoneNumber);
      }
    }
  };

  // 전화번호 입력 핸들러
  const handlePhoneNumberChange = (e) => {
    let input = e.target.value.replace(/\D/g, ''); // 숫자만 추출

    // 🔥 국가번호가 UI 버튼에 별도로 표시되므로, 사용자가 습관적으로 입력하는 맨 앞 0은 자동 제거
    // 예: 사용자가 0971562858 입력 → 971562858로 자동 정리
    if (input.startsWith('0')) {
      input = input.substring(1);
    }

    // 국가별 최대 길이 제한 (0 제거 후 길이)
    const maxLength = PHONE_MAX_LENGTH[selectedCountry.code] || 15;
    if (input.length > maxLength) {
      input = input.slice(0, maxLength);
    }

    // UI에 표시할 값 (0 제거된 값, 순수 전화번호만)
    setPhoneNumber(input);

    // 전화번호가 있으면 유효성 검사
    if (input) {
      // 유효성 검사 (0 없는 값으로 검증)
      const validation = validatePhoneByCountry(input, selectedCountry.code);

      if (!validation.isValid) {
        setValidationError(validation.error);
        setPhoneInfo(null);
      } else {
        setValidationError(null);
        setPhoneInfo(validation);
      }

      console.log('📞 전화번호 입력:', {
        originalInput: e.target.value,
        cleaned: input,
        countryCode: selectedCountry.code,
        callingCode: getCountryCallingCode(selectedCountry.code)
      });

      // ⚠️ 중요: input 필드에는 순수 전화번호만 표시
      // 서버 제출 시에만 국가번호를 붙여서 전송해야 함
      // onChange로는 순수 전화번호만 전달
      if (onChange) {
        onChange(input);
      }
    } else {
      // 입력이 비어있으면 에러 초기화
      setValidationError(null);
      setPhoneInfo(null);
      if (onChange) {
        onChange('');
      }
    }
  };

  // 드롭다운 위치 업데이트
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideTrigger = selectRef.current && selectRef.current.contains(e.target);
      const clickedInsidePortal = e.target.closest('[data-phone-select-portal="true"]');

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

  const callingCode = getCountryCallingCode(selectedCountry.code);

  // 플로팅 라벨 상태
  const isFloating = isFocused || phoneNumber;

  // TextInput과 동일한 스타일 함수
  const getInputClasses = () => {
    const baseClasses = `
      absolute inset-0 pointer-events-none
      bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border rounded-xl
      shadow-md shadow-neutral-200/25 dark:shadow-neutral-900/25
      transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
      hover:shadow-lg hover:shadow-neutral-300/30 dark:hover:shadow-neutral-900/30
    `;

    if (error || validationError) {
      return `${baseClasses}
        border-rose-400/70 dark:border-rose-500/70 bg-rose-50/50 dark:bg-rose-900/20
      `;
    }

    if (isFocused) {
      return `${baseClasses}
        border-[#2AC1BC] ring-2 ring-[#2AC1BC]/20
        shadow-lg shadow-[#2AC1BC]/15
      `;
    }

    return `${baseClasses}
      border-neutral-300/60 dark:border-gray-600/60
    `;
  };

  const getLabelClasses = () => {
    const baseClasses = `
      absolute pointer-events-none z-10
      transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
      font-semibold tracking-wide
      ${disabled ? 'text-neutral-400' : ''}
    `;

    if (error || validationError) {
      return `${baseClasses} ${isFloating ? 'text-xs top-2 left-4 transform scale-95' : 'text-sm top-1/2 left-4 -translate-y-1/2 transform'} text-rose-600`;
    }

    if (isFocused) {
      return `${baseClasses} text-xs top-2 left-4 transform scale-95 text-[#2AC1BC]`;
    }

    if (isFloating) {
      return `${baseClasses} text-xs top-2 left-4 transform scale-95 text-neutral-600 dark:text-gray-300`;
    }

    return `${baseClasses} text-sm top-1/2 left-4 -translate-y-1/2 transform text-neutral-500 dark:text-gray-400`;
  };

  // 국가별 형식 가이드 표시
  const formatGuide = PHONE_FORMAT_EXAMPLES[selectedCountry.code] || '';

  return (
    <div className={`flex flex-col gap-3 ${className}`} ref={selectRef}>
      {/* 한 줄 레이아웃: 국가 선택 + 전화번호 입력 */}
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
              : (error || validationError)
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
              console.log('🔘 Country button clicked, current isOpen:', isOpen);
              setIsOpen(!isOpen);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-sm font-medium">+{callingCode}</span>
          <span className="text-xs" aria-hidden="true">
            {isOpen ? '▲' : '▼'}
          </span>
        </button>

        {/* 전화번호 입력 필드 (오른쪽) */}
        <div className="flex-1">
          <input
            id={generatedId}
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            maxLength={PHONE_MAX_LENGTH[selectedCountry.code] || 15}
            className={`
              w-full px-3 py-2 border rounded-lg
              focus:ring-2 focus:ring-vietnam-mint
              dark:bg-gray-700 dark:text-white
              disabled:opacity-50 disabled:cursor-not-allowed
              ${(error || validationError)
                ? 'border-red-500 dark:border-red-400'
                : 'border-gray-300 dark:border-gray-600'
              }
            `}
            aria-invalid={(error || validationError) ? 'true' : 'false'}
            aria-describedby={
              (error || validationError) ? `${generatedId}-error` :
              phoneInfo?.operator ? `${generatedId}-operator` :
              helperText ? `${generatedId}-helper` : undefined
            }
          />
        </div>
      </div>

      {/* 국가 선택 드롭다운 (Portal) */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed z-[9999] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: '400px',
            marginTop: '4px'
          }}
          data-phone-select-portal="true"
          role="listbox"
        >
          {/* 검색 입력 */}
          <div className="sticky top-0 p-2 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 z-10">
            <input
              ref={searchInputRef}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#2AC1BC]"
              placeholder="국가 검색..."
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
                검색 결과가 없습니다
              </div>
            ) : (
              filteredCountries.map((country, index) => {
                const countryCallingCode = getCountryCallingCode(country.code);
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
                      <div className="font-medium">{country.nameKo}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{country.name}</div>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">+{countryCallingCode}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 에러 메시지 */}
      {(error || validationError) && (
        <p className="text-sm text-red-600 dark:text-red-400" id={`${generatedId}-error`} role="alert">
          {error || validationError}
        </p>
      )}

      {/* 통신사 정보 표시 (Local만) */}
      {!error && !validationError && phoneInfo?.operator && (
        <p id={`${generatedId}-operator`} className="text-xs text-emerald-600 dark:text-emerald-400">
          통신사: {phoneInfo.operator}
        </p>
      )}

      {/* 헬퍼 텍스트 + 형식 가이드 */}
      {!error && !validationError && helperText && (
        <p id={`${generatedId}-helper`} className="text-sm text-gray-600 dark:text-gray-400">
          {helperText}
        </p>
      )}
      {!error && !validationError && formatGuide && (
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {formatGuide}
        </p>
      )}
    </div>
  );
}
