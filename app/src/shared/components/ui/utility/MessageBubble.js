/**
 * MessageBubble - 재사용 가능한 채팅 메시지 버블 컴포넌트
 * designscreen을 참고하여 Local App에 최적화된 프리미엄 디자인
 */
import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

const MessageBubble = memo(({
  message,
  isMyMessage = false,
  showTimestamp = false,
  onRetry,
  onPress,
  onLongPress}) => {
  const { t } = useTranslation(['common', 'store']);
  // 메시지 상태 아이콘
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sending': return { name: 'clock-outline', color: '#9CA3AF' };
      case 'sent': return { name: 'check', color: '#9CA3AF' };
      case 'delivered': return { name: 'check-all', color: '#9CA3AF' };
      case 'read': return { name: 'check-all', color: '#2AC1BC' };
      case 'failed': return { name: 'alert-circle-outline', color: '#EF4444' };
      default: return null;
    }
  };

  // 메시지 시간 포맷팅
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'});
  };

  const statusIcon = getStatusIcon(message.status);

  return (
    <View className="mb-3">
      {/* 타임스탬프 표시 */}
      {showTimestamp && (
        <View className="items-center mb-3">
          <View className="bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
            <Text className="text-xs text-gray-600 font-medium">
              {new Date(message.timestamp).toLocaleDateString('ko-KR', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'})}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
        className={`flex-row ${isMyMessage ? 'justify-end' : 'justify-start'} px-4`}
      >
        {/* 매장 아바타 (상대방 메시지) */}
        {!isMyMessage && (
          <View className="mr-3">
            <View
              className="w-9 h-9 bg-primary/10 rounded-2xl items-center justify-center border border-primary/20"
              style={{
                shadowColor: '#2AC1BC',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2}}
            >
              <Icon name="store" size={16} color="#2AC1BC" />
            </View>
          </View>
        )}

        <View className={`max-w-[75%] ${isMyMessage ? 'items-end' : 'items-start'}`}>
          {/* 발신자 정보 (매장 메시지) */}
          {!isMyMessage && (
            <Text className="text-xs text-gray-600 mb-2 ml-3 font-medium">
              {t('store:store')}
            </Text>
          )}

          {/* 메시지 버블 */}
          <View
            className={`px-4 py-3 rounded-2xl ${
              isMyMessage
                ? 'bg-primary rounded-br-md'
                : 'bg-white border border-gray-200 rounded-bl-md'
            }`}
            style={{
              shadowColor: isMyMessage ? '#2AC1BC' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isMyMessage ? 0.15 : 0.05,
              shadowRadius: 6,
              elevation: isMyMessage ? 3 : 2}}
          >
            <Text
              className={`text-base leading-6 font-medium ${
                isMyMessage ? 'text-white' : 'text-gray-800'
              }`}
            >
              {message.text}
            </Text>

            {/* 내 메시지의 시간 및 상태 */}
            {isMyMessage && (
              <View className="flex-row items-center justify-end mt-2">
                <Text className="text-xs text-white/70 mr-2 font-medium">
                  {formatTime(message.timestamp)}
                </Text>
                {statusIcon && (
                  <View className="w-4 h-4 items-center justify-center">
                    <Icon
                      name={statusIcon.name}
                      size={12}
                      color={message.status === 'read' ? '#FFFFFF' : 'rgba(255,255,255,0.7)'}
                    />
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 매장 메시지 시간 */}
          {!isMyMessage && (
            <Text className="text-xs text-gray-500 mt-2 ml-3 font-medium">
              {formatTime(message.timestamp)}
            </Text>
          )}

          {/* 재전송 버튼 (실패한 내 메시지) */}
          {isMyMessage && message.status === 'failed' && onRetry && (
            <TouchableOpacity
              onPress={onRetry}
              className="bg-red-500 px-4 py-2 rounded-full mt-2 flex-row items-center"
              style={{
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3}}
            >
              <Icon name="refresh" size={14} color="#FFFFFF" />
              <Text className="text-white text-xs font-medium ml-1">{t('common:actions.retry')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
});

export default MessageBubble;
