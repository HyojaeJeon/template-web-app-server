/**
 * Heroicons 아이콘 시스템
 * 이모지를 모두 제거하고 Heroicons만 사용
 */
import React from 'react';
import {
  // Outline 아이콘들
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  UserIcon,
  ShoppingCartIcon,
  HeartIcon,
  StarIcon,
  ClockIcon,
  CalendarDaysIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BellIcon,
  HomeIcon,
  BuildingOfficeIcon,
  TruckIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  TagIcon,
  GiftIcon,
  FireIcon,
  SparklesIcon,
  LightBulbIcon,
  CameraIcon,
  PhotoIcon,
  FilmIcon,
  DocumentTextIcon,
  FolderIcon,
  ArchiveBoxIcon,
  TrashIcon,
  PencilIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SignalIcon,
  WifiIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CloudIcon,
  ServerIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  LockOpenIcon,
  KeyIcon,
  FingerPrintIcon,
  QueueListIcon,
  BookmarkIcon,
  FlagIcon,
  ChatBubbleLeftRightIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowUturnLeftIcon,
  ArrowPathIcon,
  Bars3Icon,
  EllipsisVerticalIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';

import {
  // Solid 아이콘들 (필요한 경우)
  CheckIcon as CheckIconSolid,
  XMarkIcon as XMarkIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid,
  BellIcon as BellIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
} from '@heroicons/react/24/solid';

// 아이콘 맵핑
const iconMap = {
  // 방향/네비게이션
  'chevron-down': ChevronDownIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-left': ChevronLeftIcon,
  'chevron-right': ChevronRightIcon,
  'close': XMarkIcon,
  'x': XMarkIcon,
  'plus': PlusIcon,
  'add': PlusIcon,
  'minus': MinusIcon,
  'remove': MinusIcon,
  'check': CheckIcon,
  'checkmark': CheckIcon,
  
  // 상태/피드백
  'warning': ExclamationTriangleIcon,
  'info': InformationCircleIcon,
  'success': CheckCircleIcon,
  'check-circle': CheckCircleIcon,
  'error': XCircleIcon,
  'danger': XCircleIcon,
  
  // 액션
  'eye': EyeIcon,
  'eye-off': EyeSlashIcon,
  'search': MagnifyingGlassIcon,
  'copy': DocumentDuplicateIcon,
  'share': ShareIcon,
  'print': PrinterIcon,
  'download': ArrowDownTrayIcon,
  'settings': Cog6ToothIcon,
  'config': Cog6ToothIcon,
  
  // 사용자/프로필
  'user': UserIcon,
  'profile': UserIcon,
  'account': UserIcon,
  
  // 상거래
  'cart': ShoppingCartIcon,
  'shopping': ShoppingCartIcon,
  'heart': HeartIcon,
  'favorite': HeartIcon,
  'like': HeartIcon,
  'star': StarIcon,
  'rating': StarIcon,
  
  // 시간/일정
  'clock': ClockIcon,
  'time': ClockIcon,
  'calendar': CalendarDaysIcon,
  'date': CalendarDaysIcon,
  
  // 위치/연락처
  'location': MapPinIcon,
  'map': MapPinIcon,
  'pin': MapPinIcon,
  'phone': PhoneIcon,
  'call': PhoneIcon,
  'email': EnvelopeIcon,
  'mail': EnvelopeIcon,
  'notification': BellIcon,
  'bell': BellIcon,
  
  // 장소
  'home': HomeIcon,
  'office': BuildingOfficeIcon,
  'building': BuildingOfficeIcon,
  'delivery': TruckIcon,
  'truck': TruckIcon,
  'shipping': TruckIcon,
  
  // 결제/금융
  'money': CurrencyDollarIcon,
  'currency': CurrencyDollarIcon,
  'card': CreditCardIcon,
  'credit-card': CreditCardIcon,
  'cash': BanknotesIcon,
  'banknotes': BanknotesIcon,
  'discount': ReceiptPercentIcon,
  'percent': ReceiptPercentIcon,
  'tag': TagIcon,
  'price': TagIcon,
  'gift': GiftIcon,
  'present': GiftIcon,
  
  // 특수 효과
  'fire': FireIcon,
  'hot': FireIcon,
  'sparkles': SparklesIcon,
  'magic': SparklesIcon,
  'idea': LightBulbIcon,
  'bulb': LightBulbIcon,
  
  // 미디어
  'camera': CameraIcon,
  'photo': PhotoIcon,
  'image': PhotoIcon,
  'video': FilmIcon,
  'film': FilmIcon,
  
  // 문서
  'document': DocumentTextIcon,
  'file': DocumentTextIcon,
  'folder': FolderIcon,
  'directory': FolderIcon,
  'archive': ArchiveBoxIcon,
  'box': ArchiveBoxIcon,
  'trash': TrashIcon,
  'delete': TrashIcon,
  'edit': PencilIcon,
  'pencil': PencilIcon,
  
  // 필터/정렬
  'filter': FunnelIcon,
  'adjust': AdjustmentsHorizontalIcon,
  'settings-horizontal': AdjustmentsHorizontalIcon,
  'grid': Squares2X2Icon,
  'list': ListBulletIcon,
  'menu': QueueListIcon,
  
  // 차트/통계
  'chart': ChartBarIcon,
  'bar-chart': ChartBarIcon,
  'line-chart': PresentationChartLineIcon,
  'trend-up': ArrowTrendingUpIcon,
  'trend-down': ArrowTrendingDownIcon,
  'signal': SignalIcon,
  
  // 기술/연결
  'wifi': WifiIcon,
  'mobile': DevicePhoneMobileIcon,
  'desktop': ComputerDesktopIcon,
  'cloud': CloudIcon,
  'server': ServerIcon,
  
  // 보안
  'security': ShieldCheckIcon,
  'shield': ShieldCheckIcon,
  'lock': LockClosedIcon,
  'locked': LockClosedIcon,
  'unlock': LockOpenIcon,
  'unlocked': LockOpenIcon,
  'key': KeyIcon,
  'fingerprint': FingerPrintIcon,
  
  // 북마크/플래그
  'bookmark': BookmarkIcon,
  'save': BookmarkIcon,
  'flag': FlagIcon,
  'report': FlagIcon,
  
  // 커뮤니케이션
  'chat': ChatBubbleLeftRightIcon,
  'message': ChatBubbleLeftRightIcon,
  'sound': SpeakerWaveIcon,
  'volume': SpeakerWaveIcon,
  'mute': SpeakerXMarkIcon,
  'silent': SpeakerXMarkIcon,
  
  // 미디어 컨트롤
  'play': PlayIcon,
  'play-circle': PlayIcon,
  'pause': PauseIcon,
  'stop': StopIcon,
  'next': ForwardIcon,
  'previous': BackwardIcon,
  'back': ArrowUturnLeftIcon,
  'undo': ArrowUturnLeftIcon,
  'refresh': ArrowPathIcon,
  'reload': ArrowPathIcon,
  
  // 메뉴/옵션
  'hamburger': Bars3Icon,
  'menu-bars': Bars3Icon,
  'more-vertical': EllipsisVerticalIcon,
  'more-horizontal': EllipsisHorizontalIcon,
  'options': EllipsisVerticalIcon,
  
  // Solid 버전들
  'check-solid': CheckIconSolid,
  'x-solid': XMarkIconSolid,
  'warning-solid': ExclamationTriangleIconSolid,
  'info-solid': InformationCircleIconSolid,
  'success-solid': CheckCircleIconSolid,
  'error-solid': XCircleIconSolid,
  'heart-solid': HeartIconSolid,
  'star-solid': StarIconSolid,
  'bell-solid': BellIconSolid,
  'cart-solid': ShoppingCartIconSolid,
};

/**
 * Icon 컴포넌트
 * Heroicons 기반의 통일된 아이콘 시스템
 */
const Icon = ({ 
  name, 
  size = 'md', 
  className = '', 
  solid = false,
  ...props 
}) => {
  // 사이즈 매핑
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
  };

  // Solid 버전이 요청된 경우 '-solid' 접미사 추가
  const iconName = solid && !name.endsWith('-solid') ? `${name}-solid` : name;
  const IconComponent = iconMap[iconName];

  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found. Available icons:`, Object.keys(iconMap));
    return null;
  }

  return (
    <IconComponent 
      className={`${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
};

// 자주 사용되는 아이콘들을 별도 컴포넌트로 export
export const CloseIcon = (props) => <Icon name="close" {...props} />;
export const ChevronIcon = ({ direction = 'down', ...props }) => (
  <Icon name={`chevron-${direction}`} {...props} />
);
export const CheckIcon_ = (props) => <Icon name="check" {...props} />;
export const SearchIcon = (props) => <Icon name="search" {...props} />;
export const UserIcon_ = (props) => <Icon name="user" {...props} />;
export const CartIcon = (props) => <Icon name="cart" {...props} />;
export const HeartIcon_ = (props) => <Icon name="heart" {...props} />;
export const StarIcon_ = (props) => <Icon name="star" {...props} />;
export const LocationIcon = (props) => <Icon name="location" {...props} />;
export const PhoneIcon_ = (props) => <Icon name="phone" {...props} />;
export const EmailIcon = (props) => <Icon name="email" {...props} />;

// 상태별 아이콘
export const StatusIcon = ({ status, ...props }) => {
  const statusMap = {
    success: 'success-solid',
    error: 'error-solid', 
    warning: 'warning-solid',
    info: 'info-solid',
  };
  
  return <Icon name={statusMap[status]} {...props} />;
};

export default Icon;