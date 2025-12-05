/**
 * UI Components Export Hub
 * 역할별로 구조화된 재사용 가능한 UI 컴포넌트들
 *
 * 사용법:
 * import { PrimaryButton, StoreCard, Loading } from '@shared/components/ui';
 */

// === Buttons ===
export { default as PrimaryButton } from '@shared/components/ui/buttons/PrimaryButton';
export { default as SecondaryButton } from '@shared/components/ui/buttons/SecondaryButton';
export { default as StandardButton } from '@shared/components/ui/buttons/StandardButton';
export { default as FloatingActionButton } from '@shared/components/ui/buttons/FloatingActionButton';
export { default as SaveButton } from '@shared/components/ui/buttons/SaveButton';
export { default as LogoutButton } from '@shared/components/ui/buttons/LogoutButton';
export { default as AccountDeletionButton } from '@shared/components/ui/buttons/AccountDeletionButton';
export { default as AccountSuspensionButton } from '@shared/components/ui/buttons/AccountSuspensionButton';

// === Cards ===
export { default as StoreCard } from '@shared/components/ui/cards/StoreCard';
export { default as PremiumStoreCard } from '@shared/components/ui/cards/PremiumStoreCard';
export { default as MenuItemCard } from '@shared/components/ui/cards/MenuItemCard';
export { default as ProductCard } from '@shared/components/ui/cards/ProductCard';
export { default as HorizontalProductCard } from '@shared/components/ui/cards/HorizontalProductCard';
export { default as CouponCard } from '@shared/components/ui/cards/CouponCard';
export { default as AccessibleCouponCard } from '@shared/components/ui/cards/AccessibleCouponCard';
export { default as QuickOrderCard } from '@shared/components/ui/cards/QuickOrderCard';
export { default as RealtimeOrderCard } from '@shared/components/ui/cards/RealtimeOrderCard';
export { default as DeliveryTrackerCard } from '@shared/components/ui/cards/DeliveryTrackerCard';
export { default as OrderCard } from '@shared/components/ui/cards/OrderCard';
export { default as StandardCard } from '@shared/components/ui/cards/StandardCard';
export { default as AddressCard } from '@shared/components/ui/cards/AddressCard';
export { default as MembershipCard } from '@shared/components/ui/cards/MembershipCard';
export { default as MemorizedOrderCard } from '@shared/components/ui/cards/MemorizedOrderCard';
export { default as PointsCard } from '@shared/components/ui/cards/PointsCard';
export { default as CouponsCard } from '@shared/components/ui/cards/CouponsCard';

// === Inputs ===
export { default as StandardInput } from '@shared/components/ui/inputs/StandardInput';
export { default as SearchInput } from '@shared/components/ui/inputs/SearchInput';
export { default as PhoneInput } from '@shared/components/ui/inputs/PhoneInput';
export { default as PhoneNumberInput } from '@shared/components/ui/inputs/PhoneNumberInput';
export { default as SearchBar } from '@shared/components/ui/inputs/SearchBar';
export { default as MessageInput } from '@shared/components/ui/inputs/MessageInput';

// === Modals ===
export { default as ConfirmModal } from '@shared/components/ui/modals/ConfirmModal';
export { default as MenuItemModal } from '@shared/components/ui/modals/MenuItemModal';
export { default as DatePickerModal } from '@shared/components/ui/modals/DatePickerModal';

// === Badges ===
export { default as Badge } from '@shared/components/ui/badges/Badge';
export { default as DiscountBadge, DiscountGroup } from '@shared/components/ui/badges/DiscountBadge';
export { default as EcoFriendlyBadge, EcoIcon } from '@shared/components/ui/badges/EcoFriendlyBadge';
export { default as PaymentMethodBadges } from '@shared/components/ui/badges/PaymentMethodBadges';
export { default as BaseBadge } from '@shared/components/ui/badges/BaseBadge';
export { default as StandardBadge } from '@shared/components/ui/badges/StandardBadge';
export { default as CardPaymentBadge } from '@shared/components/ui/badges/CardPaymentBadge';
export { default as FreeDeliveryBadge } from '@shared/components/ui/badges/FreeDeliveryBadge';
export { default as FeaturedBadge } from '@shared/components/ui/badges/FeaturedBadge';
export { default as NewStoreBadge } from '@shared/components/ui/badges/NewStoreBadge';
export { default as KoreanOwnedBadge } from '@shared/components/ui/badges/KoreanOwnedBadge';
export { default as PromotedBadge } from '@shared/components/ui/badges/PromotedBadge';
export { default as Open24HoursBadge } from '@shared/components/ui/badges/Open24HoursBadge';
export { default as MembershipBadge } from '@shared/components/ui/badges/MembershipBadge';

// === Navigation ===
export { default as CommonHeader } from '@shared/components/ui/navigation/CommonHeader';
export { default as AccessibleTabs } from '@shared/components/ui/navigation/AccessibleTabs';
export { default as SegmentedTabs } from '@shared/components/ui/navigation/SegmentedTabs';
export { default as SectionHeader } from '@shared/components/ui/navigation/SectionHeader';
export { default as CheckoutStepper } from '@shared/components/ui/navigation/CheckoutStepper';

// === Feedback ===
export { default as Loading } from '@shared/components/ui/feedback/Loading';
// LoadingSpinner 파일이 존재하지 않음 - Loading 컴포넌트 사용
export { default as ConnectionStatusBanner } from '@shared/components/ui/feedback/ConnectionStatusBanner';
export { default as OfflineIndicator, useOfflineStatus, useOfflineData } from '@shared/components/ui/feedback/OfflineIndicator';
// Notification components (알림 관련 컴포넌트 - notification 폴더로 구조화)
export {
  NotificationBadge,
  NotificationItem,
  NotificationCenter
} from '@shared/components/ui/feedback/notification';
// Toast System
export { ToastProvider, useToast, TOAST_MESSAGES } from '@shared/components/ui/feedback';
// Error Handling
export { ErrorBoundary, AccessibilityErrorBoundary, EnhancedErrorScreen } from '@shared/components/ui/feedback/error';

// === Layout ===
export { default as SafeAreaWrapper } from '@shared/components/ui/layout/SafeAreaWrapper';
export { default as GradientBackground } from '@shared/components/ui/layout/GradientBackground';
export { SectionSeparator, SectionSpacer } from '@shared/components/ui/layout/Separator';

// === Store Components ===
export { default as StoreRating } from '@shared/components/ui/store/StoreRating';
export { default as StoreTag, StoreTagGroup } from '@shared/components/ui/store/StoreTag';

// === Menu Components ===
export { default as MenuAvailability } from '@shared/components/ui/menu/MenuAvailability';
export { default as MenuCategoryTabs } from '@shared/components/ui/menu/MenuCategoryTabs';
export { default as MenuItems } from '@shared/components/ui/menu/MenuItems';
export { default as MenuOptionSelector } from '@shared/components/ui/menu/MenuOptionSelector';
export { default as QuantitySelector } from '@shared/components/ui/menu/QuantitySelector';
export { default as CustomizationOptions } from '@shared/components/ui/menu/CustomizationOptions';

// === Order Components ===
export { default as DeliveryInfo } from '@shared/components/ui/order/DeliveryInfo';

// === Profile Components ===
export { default as Avatar } from '@shared/components/ui/profile/Avatar';
export { default as ProfileMenu } from '@shared/components/ui/profile/ProfileMenu';
export { default as MembershipBenefitsDetail } from '@shared/components/ui/profile/MembershipBenefitsDetail';
export { default as MembershipProgressIndicator } from '@shared/components/ui/profile/MembershipProgressIndicator';

// === Review Components ===
export { default as StarRating } from '@shared/components/ui/review/StarRating';
export { default as ReviewCard } from '@shared/components/ui/review/ReviewCard';
export { default as PhotoUploader } from '@shared/components/ui/review/PhotoUploader';

// === Address Components ===
export { default as CountryPicker } from '@shared/components/ui/address/CountryPicker';

// === State Components ===
export { default as EmptyState } from '@shared/components/ui/EmptyState';

// === Auth Components ===
export { default as AuthGuard } from '@shared/components/ui/auth/AuthGuard';

// === Icons ===
export { default as HugeIcon } from '@shared/components/ui/icons/HugeIcon';
export { default as MaterialIcon } from '@shared/components/ui/icons/MaterialIcon';

// === Utility Components ===
export { default as FilterBar } from '@shared/components/ui/utility/FilterBar';
export { default as FilterChips } from '@shared/components/ui/utility/FilterChips';
export { default as SortDropdown } from '@shared/components/ui/utility/SortDropdown';
export { default as LazyImage } from '@shared/components/ui/utility/LazyImage';
export { default as PriceDisplay } from '@shared/components/ui/utility/PriceDisplay';
export { default as LanguagePicker } from '@shared/components/ui/utility/LanguagePicker';
export { default as MapView } from '@shared/components/ui/utility/MapView';
export { default as MessageBubble } from '@shared/components/ui/utility/MessageBubble';
export { default as CategoryFilter } from '@shared/components/ui/utility/CategoryFilter';
export { default as CategoryIcon } from '@shared/components/ui/utility/CategoryIcon';
export { default as StandardIcon } from '@shared/components/ui/utility/StandardIcon';
export { default as ImprovedFilterChip } from '@shared/components/ui/utility/ImprovedFilterChip';

// === Localization Components ===
export { default as VNDFormatter } from '@shared/components/ui/localization/VNDFormatter';
export { default as AddressInput } from '@shared/components/ui/localization/AddressInput';

// === Image Components ===
export { default as OptimizedImage } from '@shared/components/ui/images/OptimizedImage';