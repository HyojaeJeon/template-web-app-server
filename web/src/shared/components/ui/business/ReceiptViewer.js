'use client';

import { useState } from 'react';

/**
 * ReceiptViewer Component
 * 
 * Local 배달 앱 영수증 뷰어 컴포넌트
 * - 주문 영수증 생성 및 표시
 * - 인쇄 및 다운로드 기능
 * - Local 세금 및 통화 형식
 * - QR 코드 결제 정보
 * - 영수증 템플릿 커스터마이징
 * 
 * WCAG 2.1 준수, 키보드 네비게이션, 스크린 리더 지원
 * 
 * @param {Object} props - ReceiptViewer 컴포넌트 props
 * @param {Object} props.order - 주문 정보
 * @param {Object} props.store - 매장 정보
 * @param {Object} props.customer - 고객 정보
 * @param {Object} props.payment - 결제 정보
 * @param {boolean} props.showPrintButton - 인쇄 버튼 표시 여부
 * @param {boolean} props.showDownloadButton - 다운로드 버튼 표시 여부
 * @param {Function} props.onPrint - 인쇄 콜백
 * @param {Function} props.onDownload - 다운로드 콜백
 * @param {string} props.template - 템플릿 스타일
 * @param {string} props.className - 추가 CSS 클래스
 */
const ReceiptViewer = ({
  order = {},
  store = {},
  customer = {},
  payment = {},
  showPrintButton = true,
  showDownloadButton = true,
  onPrint,
  onDownload,
  template = 'standard',
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Local 통화 형식
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 영수증 인쇄
  const handlePrint = async () => {
    setIsLoading(true);
    try {
      if (onPrint) {
        await onPrint();
      } else {
        window.print();
      }
    } catch (error) {
      console.error('인쇄 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // PDF 다운로드
  const handleDownload = async () => {
    setIsLoading(true);
    try {
      if (onDownload) {
        await onDownload();
      }
    } catch (error) {
      console.error('다운로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 세금 계산
  const calculateTax = (subtotal) => {
    const vatRate = 0.1; // Local VAT 10%
    return subtotal * vatRate;
  };

  const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const tax = calculateTax(subtotal);
  const deliveryFee = order.deliveryFee || 0;
  const discount = order.discount || 0;
  const total = subtotal + tax + deliveryFee - discount;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 ${className}`}>
      {/* 액션 버튼 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          영수증
        </h3>
        
        <div className="flex gap-2">
          {showPrintButton && (
            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              aria-label="영수증 인쇄"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              인쇄
            </button>
          )}
          
          {showDownloadButton && (
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 transition-all"
              aria-label="영수증 다운로드"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
          )}
        </div>
      </div>

      {/* 영수증 내용 */}
      <div className="p-6" id="receipt-content">
        <div className="max-w-sm mx-auto bg-white text-black font-mono text-sm">
          {/* 매장 헤더 */}
          <div className="text-center mb-6">
            {store.logo && (
              <img 
                src={store.logo} 
                alt={store.name}
                className="w-16 h-16 mx-auto mb-2 object-contain"
              />
            )}
            <h2 className="text-lg font-bold">
              {store.name || 'Local 맛집'}
            </h2>
            <p className="text-xs mt-1">
              {store.address || '주소 정보 없음'}
            </p>
            <p className="text-xs">
              Tel: {store.phone || '전화번호 없음'}
            </p>
            {store.taxNumber && (
              <p className="text-xs">
                Tax No: {store.taxNumber}
              </p>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 my-4" />

          {/* 주문 정보 */}
          <div className="mb-4">
            <div className="flex justify-between">
              <span>주문번호:</span>
              <span>#{order.orderNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>날짜:</span>
              <span>
                {order.createdAt 
                  ? new Date(order.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'N/A'
                }
              </span>
            </div>
            {customer.name && (
              <div className="flex justify-between">
                <span>고객:</span>
                <span>{customer.name}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex justify-between">
                <span>연락처:</span>
                <span>{customer.phone}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 my-4" />

          {/* 주문 아이템 */}
          <div className="mb-4">
            {order.items?.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="flex justify-between">
                  <span className="flex-1 pr-2">
                    {item.name}
                  </span>
                  <span>
                    {item.quantity}x {formatVND(item.price)}
                  </span>
                </div>
                {item.options && item.options.length > 0 && (
                  <div className="text-xs text-gray-600 ml-2">
                    - {item.options.join(', ')}
                  </div>
                )}
                <div className="text-right">
                  {formatVND(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-400 my-4" />

          {/* 계산 내역 */}
          <div className="mb-4">
            <div className="flex justify-between">
              <span>소계:</span>
              <span>{formatVND(subtotal)}</span>
            </div>
            
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>배달료:</span>
                <span>{formatVND(deliveryFee)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>VAT (10%):</span>
              <span>{formatVND(tax)}</span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>할인:</span>
                <span>-{formatVND(discount)}</span>
              </div>
            )}
            
            <div className="border-t border-solid border-gray-400 mt-2 pt-2">
              <div className="flex justify-between font-bold text-base">
                <span>총계:</span>
                <span>{formatVND(total)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-400 my-4" />

          {/* 결제 정보 */}
          <div className="mb-4">
            <div className="flex justify-between">
              <span>결제 방법:</span>
              <span>
                {payment.method === 'momo' ? 'MoMo' :
                 payment.method === 'zalopay' ? 'ZaloPay' :
                 payment.method === 'vnpay' ? 'VNPay' :
                 payment.method === 'cash' ? '현금' :
                 payment.method || 'N/A'}
              </span>
            </div>
            
            {payment.transactionId && (
              <div className="flex justify-between">
                <span>거래ID:</span>
                <span className="text-xs">{payment.transactionId}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>결제일시:</span>
              <span>
                {payment.paidAt 
                  ? new Date(payment.paidAt).toLocaleString('vi-VN')
                  : 'N/A'
                }
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-400 my-4" />

          {/* QR 코드 (결제 완료 확인용) */}
          {payment.qrCode && (
            <div className="text-center mb-4">
              <p className="text-xs mb-2">결제 확인</p>
              <div className="w-24 h-24 mx-auto bg-gray-100 flex items-center justify-center text-xs">
                QR 코드
              </div>
            </div>
          )}

          {/* 하단 메시지 */}
          <div className="text-center text-xs mt-6">
            <p className="mb-1">
              🇻🇳 Cảm ơn bạn đã đặt hàng!
            </p>
            <p className="mb-1">
              주문해 주셔서 감사합니다!
            </p>
            <p className="text-gray-600">
              문의: {store.phone || '연락처 정보 없음'}
            </p>
            
            {store.website && (
              <p className="text-gray-600 mt-2">
                {store.website}
              </p>
            )}
          </div>

          {/* 영수증 번호 */}
          <div className="text-center text-xs mt-4 text-gray-500">
            Receipt #{order.receiptNumber || Date.now()}
          </div>
        </div>
      </div>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-2xl">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 animate-spin text-teal-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              처리 중...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptViewer;