import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  {
    code: 'ko',
    nativeName: '한국어',
    flag: '🇰🇷'},
  {
    code: 'vi',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳'},
  {
    code: 'en',
    nativeName: 'English',
    flag: '🇺🇸'},
];

/**
 * 언어 선택 컴포넌트
 */
const LanguagePicker = ({
  compact = false,
  showLabel = true,
  containerStyle}) => {
  const { t, i18n } = useTranslation('common');
  const [modalVisible, setModalVisible] = useState(false);

  const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];

  const handleLanguageChange = async (language) => {
    try {
      await i18n.changeLanguage(language.code);
      setModalVisible(false);
    } catch (error) {
      console.error('언어 변경 실패:', error);
    }
  };

  const renderLanguageItem = ({ item }) => {
    const isSelected = currentLanguage.code === item.code;

    return (
      <TouchableOpacity
        className={`flex-row items-center px-6 py-4 ${isSelected ? 'bg-primary-50' : 'bg-white'} border-b border-gray-50`}
        onPress={() => handleLanguageChange(item)}
        style={{
          borderBottomWidth: 0.5,
          borderBottomColor: '#F3F4F6'}}
      >
        {/* 국기 */}
        <Text className="text-2xl mr-4">{item.flag}</Text>

        {/* 언어명 */}
        <View className="flex-1">
          <Text className={`text-base font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
            {t(`common:languages.${item.code}`)}
          </Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            {item.nativeName}
          </Text>
        </View>

        {/* 선택 표시 */}
        {isSelected && (
          <Icon name="checkmark-circle" size={22} color="#2AC1BC" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* 언어 선택 버튼 */}
      <TouchableOpacity
        className={`flex-row items-center ${containerStyle || (compact ? 'px-2 py-1' : 'px-3 py-2')}`}
        onPress={() => setModalVisible(true)}
      >
        <Text className={compact ? 'text-lg mr-1' : 'text-xl mr-2'}>
          {currentLanguage.flag}
        </Text>
        {showLabel && !compact && (
          <Text className="text-white/90 text-sm font-medium mr-1">
            {currentLanguage.code.toUpperCase()}
          </Text>
        )}
        <Icon
          name="chevron-down"
          size={compact ? 12 : 14}
          color="rgba(255, 255, 255, 0.7)"
        />
      </TouchableOpacity>

      {/* 언어 선택 모달 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />

          <View
            className="bg-white rounded-t-3xl max-h-[60%]"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 12}}
          >
            {/* 헤더 */}
            <View className="flex-row items-center justify-between px-6 py-5 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-900">
                {t('common:language.selectTitle')}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="p-2 bg-gray-50 rounded-full"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2}}
              >
                <Icon name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* 언어 목록 */}
            <FlatList
              data={LANGUAGES}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              contentContainerClassName="pb-4"
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

LanguagePicker.displayName = 'LanguagePicker';

export default LanguagePicker;
