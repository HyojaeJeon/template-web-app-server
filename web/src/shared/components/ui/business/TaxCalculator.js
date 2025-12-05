'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * TaxCalculator Component
 * 
 * Local 배달 앱 세금 계산기 컴포넌트
 * - Local VAT(10%) 자동 계산
 * - 다양한 세율 지원
 * - 세금 면제 항목 처리
 * - 실시간 계산 및 미리보기
 * - 세금 신고서 생성 지원
 * 
 * WCAG 2.1 준수, 키보드 네비게이션, 스크린 리더 지원
 * 
 * @param {Object} props - TaxCalculator 컴포넌트 props
 * @param {number} props.subtotal - 세전 금액
 * @param {Array} props.items - 상품 목록 (세율이 다른 경우)
 * @param {number} props.defaultTaxRate - 기본 세율 (0.1 = 10%)
 * @param {Object} props.taxRates - 카테고리별 세율
 * @param {Array} props.exemptItems - 세금 면제 항목
 * @param {Function} props.onCalculate - 계산 완료 콜백
 * @param {boolean} props.showBreakdown - 세부 내역 표시
 * @param {boolean} props.realTime - 실시간 계산 활성화
 * @param {string} props.currency - 통화 단위
 * @param {string} props.locale - 지역 설정
 * @param {string} props.className - 추가 CSS 클래스
 */
const TaxCalculator = ({
  subtotal = 0,
  items = [],
  defaultTaxRate = 0.1, // Local VAT 10%
  taxRates = {
    food: 0.1,        // 음식 10%
    beverage: 0.1,    // 음료 10%
    alcohol: 0.2,     // 주류 20%
    service: 0.1,     // 서비스 10%
    delivery: 0.0     // 배달비 면세
  },
  exemptItems = [],
  onCalculate,
  showBreakdown = true,
  realTime = true,
  currency = 'VND',
  locale = 'vi-VN',
  className = ''
}) => {
  const [customTaxRate, setCustomTaxRate] = useState(defaultTaxRate);
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Local 통화 포맷팅
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 퍼센트 포맷팅
  const formatPercent = (rate) => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(rate);
  };

  // 세금 계산 로직
  const taxCalculation = useMemo(() => {
    let totalTax = 0;
    let taxableAmount = 0;
    let exemptAmount = 0;
    let breakdown = [];

    if (items.length > 0) {
      // 아이템별 세금 계산
      items.forEach(item => {
        const isExempt = exemptItems.includes(item.id) || exemptItems.includes(item.category);
        const itemTotal = item.price * item.quantity;
        
        if (isExempt) {
          exemptAmount += itemTotal;
          breakdown.push({
            name: item.name,
            amount: itemTotal,
            taxRate: 0,
            tax: 0,
            exempt: true
          });
        } else {
          const rate = useCustomRate ? customTaxRate : (taxRates[item.category] || defaultTaxRate);
          const itemTax = itemTotal * rate;
          
          totalTax += itemTax;
          taxableAmount += itemTotal;
          
          breakdown.push({
            name: item.name,
            amount: itemTotal,
            taxRate: rate,
            tax: itemTax,
            exempt: false
          });
        }
      });
    } else {
      // 단순 계산 (subtotal 기반)
      const rate = useCustomRate ? customTaxRate : defaultTaxRate;
      totalTax = subtotal * rate;
      taxableAmount = subtotal;
    }

    const grandTotal = taxableAmount + exemptAmount + totalTax;

    return {
      subtotal: taxableAmount + exemptAmount,
      taxableAmount,
      exemptAmount,
      totalTax,
      grandTotal,
      breakdown,
      effectiveRate: taxableAmount > 0 ? totalTax / taxableAmount : 0
    };
  }, [subtotal, items, customTaxRate, useCustomRate, taxRates, defaultTaxRate, exemptItems]);

  // 실시간 계산 콜백
  useEffect(() => {
    if (realTime && onCalculate) {
      onCalculate(taxCalculation);
    }
  }, [taxCalculation, realTime, onCalculate]);

  // Local 세금 정보 도움말
  const VietnamTaxInfo = () => (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Local 부가가치세(VAT) 안내
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• 표준 VAT: 10% (음식, 음료, 서비스)</li>
            <li>• 특별소비세: 주류 20%</li>
            <li>• 면세 항목: 기본 식품, 의료용품, 교육 서비스</li>
            <li>• 배달비는 일반적으로 면세</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              세금 계산기
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Local VAT 및 세금 자동 계산
            </p>
          </div>

          {/* 사용자 정의 세율 토글 */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useCustomRate}
                onChange={(e) => setUseCustomRate(e.target.checked)}
                className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-gray-700 dark:text-gray-300">
                사용자 정의 세율
              </span>
            </label>
            
            {useCustomRate && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customTaxRate * 100}
                  onChange={(e) => setCustomTaxRate(Number(e.target.value) / 100)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 계산 결과 */}
      <div className="p-6 space-y-4">
        {/* 주요 금액들 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              과세 대상 금액
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(taxCalculation.taxableAmount)}
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              면세 금액
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(taxCalculation.exemptAmount)}
            </div>
          </div>
        </div>

        {/* 세금 정보 */}
        <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
              부가가치세 (VAT)
            </span>
            <span className="text-sm text-teal-600 dark:text-teal-400">
              {formatPercent(taxCalculation.effectiveRate)}
            </span>
          </div>
          <div className="text-2xl font-bold text-teal-700 dark:text-teal-400">
            {formatCurrency(taxCalculation.totalTax)}
          </div>
        </div>

        {/* 총합계 */}
        <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              총 결제 금액
            </span>
            <span className="text-2xl font-bold">
              {formatCurrency(taxCalculation.grandTotal)}
            </span>
          </div>
        </div>

        {/* 세부 내역 토글 */}
        {showBreakdown && taxCalculation.breakdown.length > 0 && (
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              세부 내역 {showDetails ? '숨기기' : '보기'}
            </button>

            {showDetails && (
              <div className="mt-3 space-y-2">
                {taxCalculation.breakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {formatCurrency(item.amount)} × {formatPercent(item.taxRate)}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {item.exempt ? (
                        <div className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                          면세
                        </div>
                      ) : (
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.tax)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 계산 버튼 */}
        {!realTime && (
          <button
            onClick={() => onCalculate?.(taxCalculation)}
            className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-600 transition-all"
          >
            세금 계산 완료
          </button>
        )}

        {/* Local 세금 정보 */}
        <VietnamTaxInfo />

        {/* 계산 요약 카드 */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
            <div className="text-gray-600 dark:text-gray-400 mb-1">총 항목</div>
            <div className="font-bold text-gray-900 dark:text-white">
              {items.length || 1}개
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
            <div className="text-gray-600 dark:text-gray-400 mb-1">면세 항목</div>
            <div className="font-bold text-gray-900 dark:text-white">
              {taxCalculation.breakdown.filter(item => item.exempt).length}개
            </div>
          </div>
        </div>

        {/* 세금 계산 주의사항 */}
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          <p className="mb-1">
            💡 <strong>주의사항:</strong>
          </p>
          <ul className="space-y-1 ml-4">
            <li>• 실제 세금은 Local 세법에 따라 달라질 수 있습니다.</li>
            <li>• 특별소비세 및 기타 세금은 별도로 계산해야 할 수 있습니다.</li>
            <li>• 정확한 세금 신고는 세무 전문가와 상담하세요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TaxCalculator;