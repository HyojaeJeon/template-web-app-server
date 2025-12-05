/**
 * 채팅 설정 상태 관리 슬라이스
 * Local 배달 앱 점주용 채팅 설정 관리
 *
 * 특징:
 * - Redux Persist로 영구 저장
 * - 다국어 자동 응답 메시지 관리
 * - 빠른 응답 템플릿 관리
 * - 브라우저 알림 및 사운드 설정
 * - 운영시간 기반 부재중 메시지
 */
import { createSlice } from '@reduxjs/toolkit';

// 초기 상태
const initialState = {
  // 기본 설정
  chatEnabled: true,
  autoReplyEnabled: false,
  businessHoursOnly: false,

  // 다국어 환영 메시지
  welcomeMessages: {
    ko: '',
    vi: '',
    en: ''
  },

  // 다국어 부재중 메시지
  awayMessages: {
    ko: '',
    vi: '',
    en: ''
  },

  // 빠른 응답 템플릿 (번역 파일에서 초기화됨)
  quickReplies: [],

  // 알림 설정
  notifications: {
    sound: true,           // 사운드 알림 활성화
    browser: true,         // 브라우저 알림 활성화
    email: false,          // 이메일 알림 활성화
    volume: 0.6            // 알림 음량 (0.0 ~ 1.0)
  },

  // 운영 시간 설정
  operatingHours: null,    // { monday: { open: '09:00', close: '22:00', closed: false }, ... }
  expectedResponseTime: 5, // 예상 응답 시간 (분)

  // 메타데이터
  lastSyncedAt: null,      // DB와 마지막 동기화 시간
  isDirty: false,          // 저장되지 않은 변경사항 여부
  version: '1.0.0'
};

const chatSettingsSlice = createSlice({
  name: 'chatSettings',
  initialState,
  reducers: {
    // ===== DB에서 로드한 설정 전체 적용 =====
    loadChatSettings: (state, action) => {
      const dbSettings = action.payload;

      // 기본 설정
      state.chatEnabled = dbSettings.chatEnabled ?? state.chatEnabled;
      state.autoReplyEnabled = dbSettings.autoReplyEnabled ?? state.autoReplyEnabled;
      state.businessHoursOnly = dbSettings.businessHoursOnly ?? state.businessHoursOnly;

      // 환영 메시지
      state.welcomeMessages = {
        ko: dbSettings.welcomeMessageKo || '',
        vi: dbSettings.welcomeMessage || '',
        en: dbSettings.welcomeMessageEn || ''
      };

      // 부재중 메시지
      state.awayMessages = {
        ko: dbSettings.awayMessageKo || '',
        vi: dbSettings.awayMessage || '',
        en: dbSettings.awayMessageEn || ''
      };

      // 빠른 응답 템플릿
      if (dbSettings.quickReplies && Array.isArray(dbSettings.quickReplies)) {
        state.quickReplies = dbSettings.quickReplies;
      }

      // 알림 설정
      state.notifications = {
        sound: dbSettings.soundNotificationEnabled ?? state.notifications.sound,
        browser: dbSettings.pushNotificationEnabled ?? state.notifications.browser,
        email: dbSettings.emailNotificationEnabled ?? state.notifications.email,
        volume: state.notifications.volume // DB에 없는 필드는 기존 값 유지
      };

      // 운영 시간
      if (dbSettings.operatingHours) {
        state.operatingHours = dbSettings.operatingHours;
      }

      if (dbSettings.expectedResponseTime) {
        state.expectedResponseTime = dbSettings.expectedResponseTime;
      }

      // 메타데이터
      state.lastSyncedAt = Date.now();
      state.isDirty = false;
    },

    // ===== 채팅 활성화/비활성화 =====
    toggleChatEnabled: (state) => {
      state.chatEnabled = !state.chatEnabled;
      state.isDirty = true;
    },

    // ===== 자동 응답 토글 =====
    toggleAutoReply: (state) => {
      state.autoReplyEnabled = !state.autoReplyEnabled;
      state.isDirty = true;
    },

    // ===== 영업시간만 자동 응답 토글 =====
    toggleBusinessHoursOnly: (state) => {
      state.businessHoursOnly = !state.businessHoursOnly;
      state.isDirty = true;
    },

    // ===== 환영 메시지 업데이트 =====
    updateWelcomeMessages: (state, action) => {
      state.welcomeMessages = {
        ...state.welcomeMessages,
        ...action.payload
      };
      state.isDirty = true;
    },

    // ===== 부재중 메시지 업데이트 =====
    updateAwayMessages: (state, action) => {
      state.awayMessages = {
        ...state.awayMessages,
        ...action.payload
      };
      state.isDirty = true;
    },

    // ===== 빠른 응답 템플릿 전체 교체 =====
    setQuickReplies: (state, action) => {
      state.quickReplies = action.payload;
      state.isDirty = true;
    },

    // ===== 빠른 응답 템플릿 추가 =====
    addQuickReply: (state, action) => {
      const newReply = {
        id: Date.now() + Math.random(),
        ...action.payload
      };
      state.quickReplies.push(newReply);
      state.isDirty = true;
    },

    // ===== 빠른 응답 템플릿 업데이트 =====
    updateQuickReply: (state, action) => {
      const { id, ...updates } = action.payload;
      const index = state.quickReplies.findIndex(reply => reply.id === id);
      if (index !== -1) {
        state.quickReplies[index] = {
          ...state.quickReplies[index],
          ...updates
        };
        state.isDirty = true;
      }
    },

    // ===== 빠른 응답 템플릿 삭제 =====
    removeQuickReply: (state, action) => {
      const id = action.payload;
      state.quickReplies = state.quickReplies.filter(reply => reply.id !== id);
      state.isDirty = true;
    },

    // ===== 알림 설정 업데이트 =====
    updateNotificationSettings: (state, action) => {
      state.notifications = {
        ...state.notifications,
        ...action.payload
      };
      state.isDirty = true;
    },

    // ===== 사운드 알림 토글 =====
    toggleSoundNotification: (state) => {
      state.notifications.sound = !state.notifications.sound;
      state.isDirty = true;
    },

    // ===== 브라우저 알림 토글 =====
    toggleBrowserNotification: (state) => {
      state.notifications.browser = !state.notifications.browser;
      state.isDirty = true;
    },

    // ===== 이메일 알림 토글 =====
    toggleEmailNotification: (state) => {
      state.notifications.email = !state.notifications.email;
      state.isDirty = true;
    },

    // ===== 알림 음량 설정 =====
    setNotificationVolume: (state, action) => {
      const volume = Math.max(0, Math.min(1, action.payload)); // 0~1 범위 제한
      state.notifications.volume = volume;
      state.isDirty = true;
    },

    // ===== 운영 시간 설정 =====
    updateOperatingHours: (state, action) => {
      state.operatingHours = action.payload;
      state.isDirty = true;
    },

    // ===== 예상 응답 시간 설정 =====
    setExpectedResponseTime: (state, action) => {
      state.expectedResponseTime = action.payload;
      state.isDirty = true;
    },

    // ===== 설정 초기화 =====
    resetChatSettings: (state) => {
      return {
        ...initialState,
        lastSyncedAt: Date.now()
      };
    },

    // ===== 변경사항 저장 완료 표시 =====
    markAsSynced: (state) => {
      state.lastSyncedAt = Date.now();
      state.isDirty = false;
    },

    // ===== 전체 설정 업데이트 (부분 업데이트 지원) =====
    updateAllChatSettings: (state, action) => {
      return {
        ...state,
        ...action.payload,
        isDirty: true
      };
    }
  }
});

// 액션 생성자 내보내기
export const {
  loadChatSettings,
  toggleChatEnabled,
  toggleAutoReply,
  toggleBusinessHoursOnly,
  updateWelcomeMessages,
  updateAwayMessages,
  setQuickReplies,
  addQuickReply,
  updateQuickReply,
  removeQuickReply,
  updateNotificationSettings,
  toggleSoundNotification,
  toggleBrowserNotification,
  toggleEmailNotification,
  setNotificationVolume,
  updateOperatingHours,
  setExpectedResponseTime,
  resetChatSettings,
  markAsSynced,
  updateAllChatSettings
} = chatSettingsSlice.actions;

// ===== 셀렉터 =====

// 전체 채팅 설정 조회
export const selectChatSettings = (state) => state.chatSettings;

// 채팅 활성화 상태
export const selectChatEnabled = (state) => state.chatSettings.chatEnabled;

// 자동 응답 활성화 상태
export const selectAutoReplyEnabled = (state) => state.chatSettings.autoReplyEnabled;

// 영업시간만 자동 응답 여부
export const selectBusinessHoursOnly = (state) => state.chatSettings.businessHoursOnly;

// 환영 메시지 조회 (언어별)
export const selectWelcomeMessage = (language) => (state) =>
  state.chatSettings.welcomeMessages[language] || state.chatSettings.welcomeMessages.vi;

// 부재중 메시지 조회 (언어별)
export const selectAwayMessage = (language) => (state) =>
  state.chatSettings.awayMessages[language] || state.chatSettings.awayMessages.vi;

// 모든 환영 메시지 조회
export const selectAllWelcomeMessages = (state) => state.chatSettings.welcomeMessages;

// 모든 부재중 메시지 조회
export const selectAllAwayMessages = (state) => state.chatSettings.awayMessages;

// 빠른 응답 템플릿 조회
export const selectQuickReplies = (state) => state.chatSettings.quickReplies;

// 알림 설정 조회
export const selectNotificationSettings = (state) => state.chatSettings.notifications;

// 사운드 알림 활성화 상태
export const selectSoundNotificationEnabled = (state) => state.chatSettings.notifications.sound;

// 브라우저 알림 활성화 상태
export const selectBrowserNotificationEnabled = (state) => state.chatSettings.notifications.browser;

// 이메일 알림 활성화 상태
export const selectEmailNotificationEnabled = (state) => state.chatSettings.notifications.email;

// 알림 음량 조회
export const selectNotificationVolume = (state) => state.chatSettings.notifications.volume;

// 운영 시간 조회
export const selectOperatingHours = (state) => state.chatSettings.operatingHours;

// 예상 응답 시간 조회
export const selectExpectedResponseTime = (state) => state.chatSettings.expectedResponseTime;

// 변경사항 여부 조회
export const selectIsDirty = (state) => state.chatSettings.isDirty;

// 마지막 동기화 시간 조회
export const selectLastSyncedAt = (state) => state.chatSettings.lastSyncedAt;

// ===== 복합 셀렉터 (계산된 값) =====

// 현재 시간이 운영 시간 내인지 확인
export const selectIsWithinBusinessHours = (state) => {
  const operatingHours = state.chatSettings.operatingHours;
  if (!operatingHours) return true; // 운영시간 미설정 시 항상 true

  const now = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const todayHours = operatingHours[dayOfWeek];

  if (!todayHours || todayHours.closed) return false;

  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

// 자동 응답을 보내야 하는지 확인
export const selectShouldSendAutoReply = (state) => {
  const { autoReplyEnabled, businessHoursOnly } = state.chatSettings;

  if (!autoReplyEnabled) return false;
  if (!businessHoursOnly) return true;

  // 영업시간만 자동 응답 활성화된 경우
  return selectIsWithinBusinessHours(state);
};

// 리듀서 내보내기
export default chatSettingsSlice.reducer;
