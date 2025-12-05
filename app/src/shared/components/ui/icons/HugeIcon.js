import React from 'react';
import { View, Text } from 'react-native';
// TODO: react-native-svg 미설치 - Text 기반 Mock으로 임시 대체
// import { Svg, Path, G, Defs, ClipPath, Rect } from 'react-native-svg';

// HugeIcons Mock - Text/Emoji 기반으로 임시 대체
// react-native-svg 설치 후 실제 SVG 아이콘으로 교체 예정
const HugeIcon = ({ name, size = 24, color = '#000000', style }) => {
  const icons = {
    // Navigation Icons
    home: '🏠',
    search: '🔍',
    shoppingCart: '🛒',
    user: '👤',
    menu: '☰',
    arrowLeft: '←',
    arrowRight: '→',
    close: '✕',

    // Action Icons
    plus: '+',
    edit: '✏️',
    trash: '🗑️',
    save: '💾',
    share: '📤',
    download: '📥',

    // Status Icons
    check: '✓',
    alert: '⚠️',
    info: 'ℹ️',

    // Food & Store Icons
    utensils: '🍴',
    coffee: '☕',

    // Delivery Icons
    truck: '🚚',
    mapPin: '📍',

    // Communication Icons
    message: '💬',
    phone: '📞',
    notification: '🔔',

    // Payment Icons
    creditCard: '💳',
    wallet: '👛',

    // Social Icons
    heart: '❤️',
    star: '⭐',

    // Settings & Utility Icons
    settings: '⚙️',
    filter: '🔧',
    moreVertical: '⋮',
    upload: '📤',
    refresh: '🔄',
    clock: '🕐',
    history: '📜',

    // Additional Icons
    pizza: '🍕',
    wine: '🍷',
    burger: '🍔',
    bowl: '🍜',
    chef: '👨‍🍳',
    bike: '🚲',
    motorcycle: '🏍️',
    target: '🎯',
    navigation: '🧭',
    map: '🗺️',
    mail: '✉️',
    send: '📨',
    forum: '💭',
    comment: '💬',
    dollar: '💵',
    qrCode: '📱',
    receipt: '🧾',
    ticket: '🎫',
    gift: '🎁',
    heartEmpty: '🤍',
    starEmpty: '☆',
    thumbsUp: '👍',
    eye: '👁️',
    users: '👥',
    userPlus: '➕👤',
    sort: '↕️',
    moreHorizontal: '⋯',
    chevronDown: '▼',
    chevronUp: '▲',
    maximize: '⛶',

    // 기본 아이콘 (아이콘이 없을 때)
    default: '❓'
  };

  const iconContent = icons[name] || icons.default;

  return (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      <Text style={{ fontSize: size * 0.7, color, textAlign: 'center' }}>
        {iconContent}
      </Text>
    </View>
  );
};

export default HugeIcon;
