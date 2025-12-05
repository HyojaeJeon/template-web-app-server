/**
 * DatePickerModal - 재사용 가능한 생년월일 선택 모달 컴포넌트
 * 아래에서 위로 올라오는 애니메이션 적용
 * Local 배달 앱 MVP - NativeWind v4 스타일링
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  PanResponder} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_HEIGHT = 400;

const DatePickerModal = ({
  visible,
  onClose,
  onDateSelect,
  initialDate = null,
  minimumAge = 13,
  maximumAge = 100}) => {
  const { t, i18n } = useTranslation(['common', 'profile']);
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // 날짜 상태
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - maximumAge;
  const maxYear = currentYear - minimumAge;

  const [selectedYear, setSelectedYear] = useState(
    initialDate ? new Date(initialDate).getFullYear() : maxYear
  );
  const [selectedMonth, setSelectedMonth] = useState(
    initialDate ? new Date(initialDate).getMonth() + 1 : 1
  );
  const [selectedDay, setSelectedDay] = useState(
    initialDate ? new Date(initialDate).getDate() : 1
  );

  // 연도, 월, 일 배열 생성
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 선택된 연도와 월에 따른 일수 계산
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1
  );

  // 다국어 월 이름
  const getMonthName = (month) => {
    const monthNames = {
      ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
      vi: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
      en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']};

    const currentLanguage = i18n.language;

    return monthNames[currentLanguage]?.[month - 1] || monthNames.ko[month - 1];
  };

  // 다국어 년/월/일 단위
  const getDateUnits = () => {
    const units = {
      ko: { year: '년', month: '월', day: '일' },
      vi: { year: '', month: '', day: '' }, // Local어는 단위 없음
      en: { year: '', month: '', day: '' }, // 영어도 단위 없음
    };

    const currentLanguage = i18n.language;

    return units[currentLanguage] || units.ko;
  };

  // 다국어 날짜 포맷
  const formatSelectedDate = () => {
    const currentLanguage = i18n.language;

    if (currentLanguage === 'ko') {
      return `${selectedYear}년 ${selectedMonth}월 ${selectedDay}일`;
    } else if (currentLanguage === 'vi') {
      return `${selectedDay}/${selectedMonth}/${selectedYear}`;
    } else {
      return `${getMonthName(selectedMonth)} ${selectedDay}, ${selectedYear}`;
    }
  };

  // 다국어 나이 표시
  const formatAge = () => {
    const age = currentYear - selectedYear;
    const currentLanguage = i18n.language;

    if (currentLanguage === 'ko') {
      return `만 ${age}세`;
    } else if (currentLanguage === 'vi') {
      return `${age} tuổi`;
    } else {
      return `${age} years old`;
    }
  };

  // 애니메이션 효과
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8}),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true}),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: MODAL_HEIGHT,
          useNativeDriver: true,
          tension: 100,
          friction: 8}),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true}),
      ]).start();
    }
  }, [visible]);

  // 날짜 선택 완료
  const handleDateConfirm = () => {
    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
    const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    onDateSelect(formattedDate);
    onClose();
  };

  // 스크롤 피커 컴포넌트
  const ScrollPicker = ({ data, selected, onSelect, renderItem, width = 100 }) => (
    <View className="flex-1 mx-2">
      <ScrollView
        showsVerticalScrollIndicator={false}
        snapToInterval={50}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingVertical: 100}}
        style={{ height: 200 }}
      >
        {data.map((item, index) => {
          const isSelected = item === selected;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => onSelect(item)}
              className={`h-[50px] items-center justify-center rounded-lg mx-2 ${
                isSelected ? 'bg-[#2AC1BC]/10' : ''
              }`}
            >
              <Text
                className={`text-base font-medium ${
                  isSelected
                    ? 'text-[#2AC1BC] text-lg font-bold'
                    : 'text-gray-600'
                }`}
              >
                {renderItem ? renderItem(item) : item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // 선택된 일이 해당 월의 마지막 날보다 클 경우 조정
  useEffect(() => {
    const maxDays = getDaysInMonth(selectedYear, selectedMonth);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  }, [selectedYear, selectedMonth]);

  // 드래그로 닫기 기능
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 0;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 10;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100) {
        onClose();
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true}).start();
      }
    }});

  if (!visible) {return null;}

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1">
        {/* 배경 오버레이 */}
        <Animated.View
          className="flex-1 bg-black/50"
          style={{ opacity: backdropAnim }}
        >
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* 모달 컨텐츠 */}
        <Animated.View
          className="bg-white rounded-t-3xl"
          style={{
            height: MODAL_HEIGHT,
            transform: [{ translateY: slideAnim }]}}
          {...panResponder.panHandlers}
        >
          {/* 드래그 핸들 */}
          <View className="items-center py-3">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* 헤더 */}
          <View className="flex-row items-center justify-between px-6 py-3 border-b border-gray-100">
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-gray-500 text-base">{t('common.cancel')}</Text>
            </TouchableOpacity>

            <Text className="text-lg font-bold text-gray-900">
              {t('profile.selectBirthdate')}
            </Text>

            <TouchableOpacity onPress={handleDateConfirm} className="p-2">
              <Text className="text-[#2AC1BC] text-base font-semibold">
                {t('common.done')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 선택된 날짜 표시 */}
          <View className="px-6 py-4 bg-gray-50">
            <Text className="text-center text-lg font-semibold text-gray-800">
              {formatSelectedDate()}
            </Text>
            <Text className="text-center text-sm text-gray-600 mt-1">
              {formatAge()}
            </Text>
          </View>

          {/* 날짜 선택 피커 */}
          <View className="flex-1 px-4">
            <View className="flex-row items-center justify-center h-full">
              {/* 연도 선택 */}
              <ScrollPicker
                data={years}
                selected={selectedYear}
                onSelect={setSelectedYear}
                renderItem={(year) => {
                  const units = getDateUnits();
                  return `${year}${units.year}`;
                }}
              />

              {/* 월 선택 */}
              <ScrollPicker
                data={months}
                selected={selectedMonth}
                onSelect={setSelectedMonth}
                renderItem={(month) => getMonthName(month)}
              />

              {/* 일 선택 */}
              <ScrollPicker
                data={days}
                selected={selectedDay}
                onSelect={setSelectedDay}
                renderItem={(day) => {
                  const units = getDateUnits();
                  return `${day}${units.day}`;
                }}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default DatePickerModal;
