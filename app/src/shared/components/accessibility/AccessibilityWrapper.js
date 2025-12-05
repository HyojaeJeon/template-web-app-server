/**
 * AccessibilityWrapper
 * 접근성 향상을 위한 래퍼 컴포넌트
 * WCAG 2.1 AA 준수
 */
import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, findNodeHandle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAccessibilityInfo } from '@shared/utils/platform/accessibility/accessibilityHelper';

// 접근성 역할 타입
const ACCESSIBILITY_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  TEXT: 'text',
  IMAGE: 'image',
  HEADER: 'header',
  LIST: 'list',
  LISTITEM: 'listitem',
  TAB: 'tab',
  TABLIST: 'tablist',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  SEARCH: 'search',
  FORM: 'form',
  TEXTBOX: 'textbox',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  SLIDER: 'slider',
  SWITCH: 'switch',
  PROGRESSBAR: 'progressbar',
  ALERT: 'alert',
  DIALOG: 'dialog',
  TOOLTIP: 'tooltip'};

// 접근성 상태 타입
const ACCESSIBILITY_STATES = {
  DISABLED: 'disabled',
  SELECTED: 'selected',
  CHECKED: 'checked',
  EXPANDED: 'expanded',
  BUSY: 'busy'};

// 접근성 라이브 영역 타입
const ACCESSIBILITY_LIVE_REGION = {
  NONE: 'none',
  POLITE: 'polite',
  ASSERTIVE: 'assertive'};

const AccessibilityWrapper = ({
  children,

  // 기본 접근성 속성
  accessibilityRole = ACCESSIBILITY_ROLES.TEXT,
  accessibilityLabel,
  accessibilityHint,
  accessibilityValue,

  // 접근성 상태
  disabled = false,
  selected = false,
  checked = null, // null, true, false, 'mixed'
  expanded = null, // null, true, false
  busy = false,

  // 상호작용
  onPress,
  onLongPress,
  onAccessibilityTap,
  onAccessibilityFocus,
  onAccessibilityBlur,

  // 포커스 관리
  autoFocus = false,
  focusable = true,

  // 라이브 영역
  accessibilityLiveRegion = ACCESSIBILITY_LIVE_REGION.NONE,

  // 그룹화 (타입 안전성 보장)
  accessibilityElementsHidden = false,
  importantForAccessibility = 'auto', // auto, yes, no, no-hide-descendants

  // 최소 터치 영역 (44x44pt)
  minTouchTarget = true,

  // 스타일
  style,
  className,

  // 추가 속성
  testID,
  ...rest
}) => {
  const { t } = useTranslation();
  const ref = useRef(null);

  // 자동 포커스
  useEffect(() => {
    if (autoFocus && ref.current) {
      const node = findNodeHandle(ref.current);
      if (node) {
        SafeAccessibilityInfo.setAccessibilityFocus(node);
      }
    }
  }, [autoFocus]);

  // 접근성 상태 생성
  const getAccessibilityState = () => {
    const state = {};

    if (disabled) {state.disabled = true;}
    if (selected) {state.selected = true;}
    if (checked !== null) {state.checked = checked;}
    if (expanded !== null) {state.expanded = expanded;}
    if (busy) {state.busy = true;}

    return state;
  };

  // 접근성 액션 생성
  const getAccessibilityActions = () => {
    const actions = [];

    if (onPress) {
      actions.push({
        name: 'activate',
        label: accessibilityLabel || t('accessibility.actions.activate')});
    }

    if (onLongPress) {
      actions.push({
        name: 'longpress',
        label: t('accessibility.actions.longPress')});
    }

    // 커스텀 액션들 추가 가능
    if (accessibilityRole === ACCESSIBILITY_ROLES.BUTTON) {
      if (expanded !== null) {
        actions.push({
          name: 'expand',
          label: expanded
            ? t('accessibility.actions.collapse')
            : t('accessibility.actions.expand')});
      }
    }

    return actions.length > 0 ? actions : undefined;
  };

  // 접근성 액션 핸들러
  const handleAccessibilityAction = (event) => {
    switch (event.nativeEvent.actionName) {
      case 'activate':
        if (onPress) {onPress();}
        break;
      case 'longpress':
        if (onLongPress) {onLongPress();}
        break;
      case 'expand':
        // 확장/축소 로직은 부모 컴포넌트에서 처리
        if (onPress) {onPress();}
        break;
      default:
        break;
    }
  };

  // 최소 터치 영역 스타일
  const getTouchTargetStyle = () => {
    if (!minTouchTarget || !onPress) {return {};}

    return {
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center'};
  };

  // 접근성 props 타입 안전성 보장
  const safeAccessibilityElementsHidden = typeof accessibilityElementsHidden === 'boolean' ? accessibilityElementsHidden : false;
  const safeImportantForAccessibility = typeof importantForAccessibility === 'string' &&
    ['auto', 'yes', 'no', 'no-hide-descendants'].includes(importantForAccessibility) ?
    importantForAccessibility : 'auto';
  const safeFocusable = typeof focusable === 'boolean' ? focusable : true;

  // 기본 접근성 속성
  const baseAccessibilityProps = {
    accessible: true,
    accessibilityRole,
    accessibilityLabel,
    accessibilityHint,
    accessibilityValue,
    accessibilityState: getAccessibilityState(),
    accessibilityActions: getAccessibilityActions(),
    accessibilityLiveRegion,
    accessibilityElementsHidden: safeAccessibilityElementsHidden,
    importantForAccessibility: safeImportantForAccessibility,
    onAccessibilityAction: handleAccessibilityAction,
    onAccessibilityTap: onAccessibilityTap || onPress,
    onAccessibilityFocus,
    onAccessibilityBlur,
    focusable: safeFocusable,
    testID};

  // 상호작용이 있는 경우 TouchableOpacity 사용
  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={[
          getTouchTargetStyle(),
          style,
        ]}
        className={className}
        activeOpacity={0.7}
        {...baseAccessibilityProps}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  // 일반적인 뷰 컨테이너
  return (
    <View
      ref={ref}
      style={style}
      className={className}
      {...baseAccessibilityProps}
      {...rest}
    >
      {children}
    </View>
  );
};

// 접근성 헬퍼 컴포넌트들
export const AccessibleButton = ({ children, accessibilityLabel, onPress, ...props }) => (
  <AccessibilityWrapper
    accessibilityRole={ACCESSIBILITY_ROLES.BUTTON}
    accessibilityLabel={accessibilityLabel}
    onPress={onPress}
    minTouchTarget={true}
    {...props}
  >
    {children}
  </AccessibilityWrapper>
);

export const AccessibleText = ({ children, level = 1, ...props }) => (
  <AccessibilityWrapper
    accessibilityRole={level === 1 ? ACCESSIBILITY_ROLES.HEADER : ACCESSIBILITY_ROLES.TEXT}
    {...props}
  >
    {children}
  </AccessibilityWrapper>
);

export const AccessibleImage = ({ alt, ...props }) => (
  <AccessibilityWrapper
    accessibilityRole={ACCESSIBILITY_ROLES.IMAGE}
    accessibilityLabel={alt}
    {...props}
  />
);

export const AccessibleList = ({ children, ...props }) => (
  <AccessibilityWrapper
    accessibilityRole={ACCESSIBILITY_ROLES.LIST}
    {...props}
  >
    {children}
  </AccessibilityWrapper>
);

export const AccessibleListItem = ({ children, ...props }) => (
  <AccessibilityWrapper
    accessibilityRole={ACCESSIBILITY_ROLES.LISTITEM}
    {...props}
  >
    {children}
  </AccessibilityWrapper>
);

export const AccessibleAlert = ({ message, type = 'info', ...props }) => {
  const { t } = useTranslation();

  const alertLabel = `${t(`accessibility.alert.${type}`)}: ${message}`;

  return (
    <AccessibilityWrapper
      accessibilityRole={ACCESSIBILITY_ROLES.ALERT}
      accessibilityLabel={alertLabel}
      accessibilityLiveRegion={ACCESSIBILITY_LIVE_REGION.ASSERTIVE}
      importantForAccessibility="yes"
      {...props}
    >
      <Text>{message}</Text>
    </AccessibilityWrapper>
  );
};

// 접근성 훅
export const useAccessibilityAnnouncement = () => {
  const announce = (message, delay = 100) => {
    setTimeout(() => {
      SafeAccessibilityInfo.announceForAccessibility(message);
    }, delay);
  };

  return { announce };
};

// 접근성 유틸리티
export const AccessibilityUtils = {
  // 스크린 리더 사용 여부 확인
  isScreenReaderEnabled: async () => {
    return await SafeAccessibilityInfo.isScreenReaderEnabled();
  },

  // 접근성 서비스 사용 여부 확인
  isAccessibilityServiceEnabled: async () => {
    return await SafeAccessibilityInfo.isAccessibilityServiceEnabled();
  },

  // 포커스 설정
  setFocus: (nodeRef) => {
    if (nodeRef.current) {
      const node = findNodeHandle(nodeRef.current);
      if (node) {
        SafeAccessibilityInfo.setAccessibilityFocus(node);
      }
    }
  },

  // 알림 메시지 전송
  announce: (message) => {
    SafeAccessibilityInfo.announceForAccessibility(message);
  }};

// 상수 내보내기
export {
  ACCESSIBILITY_ROLES,
  ACCESSIBILITY_STATES,
  ACCESSIBILITY_LIVE_REGION};

export default AccessibilityWrapper;
