/**
 * GraphQL Input Types - Reference Documentation
 * GraphQL Input 타입 참조 문서
 *
 * @description
 * - 실제 사용 시에는 변수에서 직접 정의하세요.
 * - 이 파일은 타입 참조 및 문서화 목적입니다.
 *
 * @author Template Project
 */

// ===============================================
// Auth Domain Input Types
// ===============================================

/**
 * 회원가입 입력 타입
 * @server MobileRegisterInput
 */
export const MobileRegisterInputDoc = `
  input MobileRegisterInput {
    phone: String!              # 전화번호
    password: String!           # 비밀번호
    fullName: String            # 이름
    email: String               # 이메일 (선택)
    preferredLanguage: String   # 선호 언어 (vi/en/ko)
  }
`;

/**
 * 로그인 입력 타입
 * @server MobileLoginInput
 */
export const MobileLoginInputDoc = `
  input MobileLoginInput {
    phone: String!              # 전화번호
    password: String!           # 비밀번호
  }
`;

/**
 * 소셜 로그인 입력 타입
 * @server MobileSocialLoginInput
 */
export const MobileSocialLoginInputDoc = `
  input MobileSocialLoginInput {
    provider: String!           # facebook, google, zalo
    accessToken: String!        # 소셜 액세스 토큰
    email: String               # 이메일 (선택)
    fullName: String            # 이름 (선택)
    avatarUrl: String           # 프로필 이미지 (선택)
  }
`;

/**
 * OTP 검증 입력 타입
 * @server MobileVerifyOTPInput
 */
export const MobileVerifyOTPInputDoc = `
  input MobileVerifyOTPInput {
    phone: String!              # 전화번호
    code: String!               # OTP 코드
  }
`;

// ===============================================
// Profile Domain Input Types
// ===============================================

/**
 * 프로필 업데이트 입력 타입
 * @server MobileUpdateProfileInput
 */
export const MobileUpdateProfileInputDoc = `
  input MobileUpdateProfileInput {
    fullName: String            # 이름
    email: String               # 이메일
    preferredLanguage: String   # 선호 언어
    address: String             # 주소
  }
`;

/**
 * 프로필 이미지 업로드 입력 타입
 * @server MobileUploadProfileImageInput
 */
export const MobileUploadProfileImageInputDoc = `
  input MobileUploadProfileImageInput {
    imageUrl: String            # 이미지 URL
    imageData: String           # Base64 인코딩 이미지
  }
`;

// ===============================================
// Password Domain Input Types
// ===============================================

/**
 * 비밀번호 리셋 요청 입력 타입
 * @server MobilePasswordResetRequestInput
 */
export const MobilePasswordResetRequestInputDoc = `
  input MobilePasswordResetRequestInput {
    phone: String!              # 전화번호
  }
`;

/**
 * 비밀번호 리셋 입력 타입
 * @server MobilePasswordResetInput
 */
export const MobilePasswordResetInputDoc = `
  input MobilePasswordResetInput {
    phone: String!              # 전화번호
    code: String!               # OTP 코드
    newPassword: String!        # 새 비밀번호
  }
`;
