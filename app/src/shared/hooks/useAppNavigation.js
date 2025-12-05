import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { navigate, goBack, reset } from '@navigation/services/NavigationService';

export const useAppNavigation = () => {
  const navigation = useNavigation();

  const goToHome = useCallback(() => navigate('HomeTab'), []);
  const goToStore = useCallback(() => navigate('StoreTab'), []);
  const goToCart = useCallback(() => navigate('CartTab'), []);
  const goToChat = useCallback(() => navigate('ChatTab'), []);
  const goToOrder = useCallback(() => navigate('OrderTab'), []);
  const goToProfile = useCallback(() => navigate('ProfileTab'), []);

  const goToSearch = useCallback((query) => navigate('Search', { query }), []);
  const goToNotifications = useCallback(() => navigate('Notifications'), []);
  const goToStoreDetail = useCallback((storeId, initialTab) =>
    navigate('StoreDetail', { storeId, initialTab }), []);
  const goToOrderDetail = useCallback((orderId) =>
    navigate('OrderDetail', { orderId }), []);
  const goToCheckout = useCallback((cartItems) =>
    navigate('Checkout', { cartItems }), []);
  const goToPayment = useCallback((orderData) =>
    navigate('PaymentProcess', { orderData }), []);
  const goToOrderSuccess = useCallback((orderId) =>
    navigate('OrderSuccess', { orderId }), []);
  const goToAddressManagement = useCallback(() =>
    navigate('AddressManagement'), []);
  const goToEditProfile = useCallback(() =>
    navigate('EditProfile'), []);
  const goToChangePassword = useCallback(() =>
    navigate('ChangePassword'), []);
  const goToSettings = useCallback(() =>
    navigate('Settings'), []);

  const goToLogin = useCallback(() => reset([{ name: 'Auth' }]), []);

  const goBackSafe = useCallback(() => {
    if (navigation.canGoBack()) {
      goBack();
    } else {
      goToHome();
    }
  }, [navigation]);

  const resetToHome = useCallback(() => {
    reset([{ name: 'Main' }, { name: 'HomeTab' }]);
  }, []);

  return {
    goToHome,
    goToStore,
    goToCart,
    goToChat,
    goToOrder,
    goToProfile,
    goToSearch,
    goToNotifications,
    goToStoreDetail,
    goToOrderDetail,
    goToCheckout,
    goToPayment,
    goToOrderSuccess,
    goToAddressManagement,
    goToEditProfile,
    goToChangePassword,
    goToSettings,
    goToLogin,
    goBack: goBackSafe,
    resetToHome,
    canGoBack: navigation.canGoBack
  };
};

export default useAppNavigation;