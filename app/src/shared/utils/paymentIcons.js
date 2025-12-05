/**
 * 결제 수단 아이콘 매핑 유틸리티
 * bank-logo 디렉토리의 실제 이미지를 사용하여 결제 방법별 아이콘 제공
 */

// 결제 수단 이미지 import
const PAYMENT_IMAGES = {
  // MoMo 결제
  momo: require('@assets/images/payment/momo-logo.png'),

  // 은행 결제 수단들
  zalopay: require('@assets/bank-logo/zalopay.png'),
  napas: require('@assets/bank-logo/napas.png'),
  bidv: require('@assets/bank-logo/bidv.png'),
  mb: require('@assets/bank-logo/mb.png'),
  shinhan: require('@assets/bank-logo/shinhan.png'),

  // 기본 아이콘 (VNPay, COD 등 아이콘이 없는 경우)
  default: null // MaterialIcons 사용
};

/**
 * 결제 방법 ID에 따른 아이콘 이미지 반환
 * @param {string} paymentMethod - 결제 방법 ID (cod, momo, zalopay, vnpay 등)
 * @returns {object|null} - 이미지 소스 객체 또는 null (MaterialIcons 사용 시)
 */
export const getPaymentIcon = (paymentMethod) => {
  if (!paymentMethod) return null;

  const methodKey = paymentMethod.toLowerCase();

  // 정확한 매핑
  const iconMapping = {
    'momo': PAYMENT_IMAGES.momo,
    'zalopay': PAYMENT_IMAGES.zalopay,
    'napas_qr': PAYMENT_IMAGES.napas,
    'napas': PAYMENT_IMAGES.napas,
    'infocms_bidv': PAYMENT_IMAGES.bidv,
    'bidv': PAYMENT_IMAGES.bidv,
    'mbbank': PAYMENT_IMAGES.mb,
    'mb': PAYMENT_IMAGES.mb,
    'infocms_shinhan': PAYMENT_IMAGES.shinhan,
    'shinhan': PAYMENT_IMAGES.shinhan,

    // 아이콘이 없는 결제 수단들 (MaterialIcons 사용)
    'cod': null,
    'vnpay': null,
    'cash': null,
    'card': null,
    'bank_transfer': null,
    'points': null,
    'wallet': null
  };

  return iconMapping[methodKey] || null;
};

/**
 * 결제 방법에 MaterialIcons이 필요한지 확인
 * @param {string} paymentMethod - 결제 방법 ID
 * @returns {boolean} - MaterialIcons 사용 여부
 */
export const shouldUseIcon = (paymentMethod) => {
  return getPaymentIcon(paymentMethod) === null;
};

/**
 * MaterialIcons용 아이콘 이름 반환
 * @param {string} paymentMethod - 결제 방법 ID
 * @returns {string} - MaterialIcons 아이콘 이름
 */
export const getIconName = (paymentMethod) => {
  if (!paymentMethod) return 'account-balance';

  const methodKey = paymentMethod.toLowerCase();

  const iconNames = {
    'cod': 'payments',
    'vnpay': 'account-balance',
    'cash': 'payments',
    'card': 'credit-card',
    'bank_transfer': 'account-balance',
    'points': 'stars',
    'wallet': 'account-balance-wallet'
  };

  return iconNames[methodKey] || 'account-balance';
};

/**
 * 결제 방법별 색상 반환
 * @param {string} paymentMethod - 결제 방법 ID
 * @returns {string} - 색상 코드
 */
export const getPaymentColor = (paymentMethod) => {
  if (!paymentMethod) return '#2AC1BC';

  const methodKey = paymentMethod.toLowerCase();

  const colors = {
    'momo': '#A50064',      // MoMo 브랜드 색상
    'zalopay': '#0068FF',   // ZaloPay 브랜드 색상
    'napas': '#003087',     // NAPAS 브랜드 색상
    'bidv': '#1E3A8A',      // BIDV 브랜드 색상
    'mb': '#0066CC',        // MB Bank 브랜드 색상
    'shinhan': '#0047AB',   // 신한은행 브랜드 색상
    'vnpay': '#FF6B35',     // VNPay 브랜드 색상
    'cod': '#2AC1BC',       // 기본 민트색
    'cash': '#2AC1BC',
    'card': '#2AC1BC',
    'bank_transfer': '#2AC1BC',
    'points': '#FFDD00',    // 포인트는 골드색
    'wallet': '#2AC1BC'
  };

  return colors[methodKey] || '#2AC1BC';
};