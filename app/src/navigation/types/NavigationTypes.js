// 스크린 이름 상수
export const SCREEN_NAMES = {
  // Auth Stack
  AUTH: 'Auth',
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  VERIFY_OTP: 'VerifyOTP',

  // Main Tab
  HOME_TAB: 'HomeTab',
  STORE_TAB: 'StoreTab',
  CART_TAB: 'CartTab',
  ORDER_TAB: 'OrderTab',
  CHAT_TAB: 'ChatTab',
  PROFILE_TAB: 'ProfileTab',

  // Home Stack
  HOME: 'Home',
  SEARCH: 'Search',
  STORE_DETAIL: 'StoreDetail',
  MENU_DETAIL: 'MenuDetail',

  // Store Stack
  STORE_LIST: 'StoreList',
  STORE_SEARCH: 'StoreSearch',
  STORE_FILTER: 'StoreFilter',

  // Order Stack
  ORDER_LIST: 'OrderList',
  ORDER_DETAIL: 'OrderDetail',
  ORDER_TRACKING: 'OrderTracking',
  ORDER_REVIEW: 'OrderReview',

  // Cart & Checkout
  CART: 'Cart',
  CHECKOUT: 'Checkout',
  PAYMENT: 'Payment',
  PAYMENT_PROCESS: 'PaymentProcess',
  PAYMENT_METHODS: 'PaymentMethods',
  PAYMENT_HISTORY: 'PaymentHistory',
  QR_PAYMENT: 'QRPayment',
  ORDER_SUCCESS: 'OrderSuccess',

  // Profile Stack
  PROFILE: 'Profile',
  EDIT_PROFILE: 'EditProfile',
  CHANGE_PASSWORD: 'ChangePassword',
  ADDRESS_LIST: 'AddressList',
  ADDRESS_FORM: 'AddressForm',
  MAP_PICKER: 'MapPicker',
  SETTINGS: 'Settings',
  HELP: 'Help',
  ABOUT: 'About',

  // Membership & Points
  MEMBERSHIP: 'Membership',
  MEMBERSHIP_BENEFITS: 'MembershipBenefits',
  MEMBERSHIP_UPGRADE: 'MembershipUpgrade',
  POINTS_HISTORY: 'PointsHistory',
  USE_POINTS: 'UsePoints',

  // Coupon & Promotions
  MY_COUPONS: 'MyCoupons',
  COUPON_CENTER: 'CouponCenter',
  COUPON_DETAIL: 'CouponDetail',
  PROMOTIONS: 'Promotions',

  // Reviews
  MY_REVIEWS: 'MyReviews',

  // Location & Delivery
  DELIVERY_MAP: 'DeliveryMap',
  FAVORITES: 'Favorites',

  // Menu
  POPULAR_MENUS: 'PopularMenus',

  // Chat Stack
  CHAT_LIST: 'ChatList',
  CHAT_ROOM: 'ChatRoom',

  // Common
  NOTIFICATION: 'Notification',
  WEBVIEW: 'WebView',
};

// 네비게이션 파라미터 타입
export const NAVIGATION_PARAMS = {
  [SCREEN_NAMES.STORE_DETAIL]: {
    storeId: 'string',
    storeName: 'string?',
  },
  [SCREEN_NAMES.MENU_DETAIL]: {
    menuId: 'string',
    storeId: 'string',
  },
  [SCREEN_NAMES.ORDER_DETAIL]: {
    orderId: 'string',
  },
  [SCREEN_NAMES.ORDER_TRACKING]: {
    orderId: 'string',
    deliveryId: 'string?',
  },
  [SCREEN_NAMES.CHAT_ROOM]: {
    roomId: 'string',
    storeId: 'string?',
    storeName: 'string?',
  },
  [SCREEN_NAMES.ADDRESS_FORM]: {
    addressId: 'string?',
    mode: 'create|edit',
  },
  [SCREEN_NAMES.MAP_PICKER]: {
    latitude: 'number?',
    longitude: 'number?',
    onLocationSelect: 'function',
  },
  [SCREEN_NAMES.WEBVIEW]: {
    url: 'string',
    title: 'string?',
  },
  [SCREEN_NAMES.COUPON_DETAIL]: {
    couponId: 'string',
    coupon: 'object?',
  },
  [SCREEN_NAMES.PAYMENT_PROCESS]: {
    orderId: 'string',
    paymentMethod: 'string',
    amount: 'number',
  },
  [SCREEN_NAMES.QR_PAYMENT]: {
    amount: 'number',
    orderId: 'string?',
  },
  [SCREEN_NAMES.DELIVERY_MAP]: {
    orderId: 'string',
    deliveryId: 'string?',
  },
  [SCREEN_NAMES.USE_POINTS]: {
    amount: 'number',
    availablePoints: 'number',
  },
};

// 딥링크 경로
export const DEEP_LINK_PATHS = {
  store: 'store/:storeId',
  menu: 'menu/:menuId',
  order: 'order/:orderId',
  chat: 'chat/:roomId',
  profile: 'profile',
  settings: 'settings',
  notification: 'notifications',
  coupon: 'coupon/:couponId',
  favorites: 'favorites',
  membership: 'membership',
  delivery: 'delivery/:orderId',
  payment: 'payment',
};