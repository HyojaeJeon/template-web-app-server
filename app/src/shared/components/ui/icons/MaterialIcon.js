import React from 'react';
import { View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const MaterialIcon = ({ name, size = 24, color = '#000000', style, community = false }) => {
  const iconMap = {
    // Navigation Icons
    home: { name: 'home', community: false },
    search: { name: 'search', community: false },
    shoppingCart: { name: 'shopping-cart', community: false },
    user: { name: 'person', community: false },
    menu: { name: 'menu', community: false },
    arrowLeft: { name: 'arrow-back', community: false },
    arrowRight: { name: 'arrow-forward', community: false },
    close: { name: 'close', community: false },

    // Action Icons
    plus: { name: 'add', community: false },
    edit: { name: 'edit', community: false },
    trash: { name: 'delete', community: false },
    save: { name: 'save', community: false },
    share: { name: 'share', community: false },
    download: { name: 'file-download', community: false },

    // Status Icons
    check: { name: 'check', community: false },
    alert: { name: 'warning', community: false },
    info: { name: 'info', community: false },

    // Food & Store Icons
    utensils: { name: 'store', community: false },
    coffee: { name: 'local-cafe', community: false },

    // Delivery Icons
    truck: { name: 'local-shipping', community: false },
    mapPin: { name: 'place', community: false },

    // Communication Icons
    message: { name: 'message', community: false },
    phone: { name: 'phone', community: false },
    notification: { name: 'notifications', community: false },

    // Payment Icons
    creditCard: { name: 'credit-card', community: false },
    wallet: { name: 'account-balance-wallet', community: false },

    // Social Icons
    heart: { name: 'favorite', community: false },
    star: { name: 'star', community: false },

    // Settings & Utility Icons
    settings: { name: 'settings', community: false },
    filter: { name: 'filter-list', community: false },
    moreVertical: { name: 'more-vert', community: false },
    upload: { name: 'file-upload', community: false },
    refresh: { name: 'refresh', community: false },
    clock: { name: 'access-time', community: false },
    history: { name: 'history', community: false },

    // Additional Icons for IconsTab
    pizza: { name: 'local-pizza', community: false },
    wine: { name: 'wine-bar', community: false },
    burger: { name: 'lunch-dining', community: false },
    bowl: { name: 'ramen-dining', community: false },
    chef: { name: 'store-menu', community: false },
    bike: { name: 'pedal-bike', community: false },
    motorcycle: { name: 'two-wheeler', community: false },
    target: { name: 'gps-fixed', community: false },
    navigation: { name: 'navigation', community: false },
    map: { name: 'map', community: false },
    mail: { name: 'mail', community: false },
    send: { name: 'send', community: false },
    forum: { name: 'forum', community: false },
    comment: { name: 'comment', community: false },
    dollar: { name: 'attach-money', community: false },
    qrCode: { name: 'qr-code-scanner', community: false },
    receipt: { name: 'receipt', community: false },
    ticket: { name: 'confirmation-number', community: false },
    gift: { name: 'card-giftcard', community: false },
    heartEmpty: { name: 'favorite-border', community: false },
    starEmpty: { name: 'star-border', community: false },
    thumbsUp: { name: 'thumb-up', community: false },
    eye: { name: 'visibility', community: false },
    users: { name: 'people', community: false },
    userPlus: { name: 'person-add', community: false },
    sort: { name: 'sort', community: false },
    moreHorizontal: { name: 'more-horiz', community: false },
    chevronDown: { name: 'keyboard-arrow-down', community: false },
    chevronUp: { name: 'keyboard-arrow-up', community: false },
    maximize: { name: 'fullscreen', community: false },

    // 기본 아이콘 (아이콘이 없을 때)
    default: { name: 'help-outline', community: false }};

  const iconConfig = iconMap[name] || iconMap.default;
  const IconComponent = iconConfig.community ? MaterialCommunityIcons : MaterialIcons;

  return (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      <IconComponent
        name={iconConfig.name}
        size={size}
        color={color}
      />
    </View>
  );
};

export default MaterialIcon;
