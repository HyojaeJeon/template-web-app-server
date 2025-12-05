# Success & Error Message System

## 📁 구조
```
/src/shared/
├── errorSystem/           # 에러 메시지 시스템
│   ├── mobileErrorCodes.js  # 모바일 에러 (M1xxx-M9xxx)
│   └── storeErrorCodes.js    # 점주 에러 (S1xxx-S9xxx)
│
└── successSystem/         # 성공 메시지 시스템
    ├── mobileSuccessCodes.js # 모바일 성공 (MS001-MS999)
    └── storeSuccessCodes.js   # 점주 성공 (SS001-SS999)
```

## 🔤 코드 체계

### Mobile (배달앱)
- **에러**: M1xxx-M9xxx
- **성공**: MS001-MS999

### Store (점주앱)
- **에러**: S1xxx-S9xxx  
- **성공**: SS001-SS999

## 💡 사용법

### 에러 처리
```javascript
import { handleMobileError } from '@graphql/clients/mobile/utils/MobileResolverUtils';

// 에러 throw
handleMobileError('M2005', context); // CUSTOMER_NOT_FOUND
```

### 성공 응답
```javascript
import { handleMobileSuccess } from '@graphql/clients/mobile/utils/MobileResolverUtils';

// 성공 응답 생성
return handleMobileSuccess('MS001', context, { user }); // REGISTRATION_SUCCESSFUL
```

## 🌐 다국어 지원
- **vi**: 베트남어 (기본)
- **en**: 영어
- **ko**: 한국어

## ⚠️ 중요 사항
1. 하드코딩 메시지 절대 금지
2. 모든 메시지는 코드 시스템 사용
3. 새 메시지 추가 시 3개 언어 모두 작성
4. key 값은 대문자 SNAKE_CASE만 사용

## 📝 기존 i18n 시스템
- 기존 i18n 시스템은 `/src/shared/i18n_backup/`에 백업됨
- UI 텍스트나 일반 메시지가 필요한 경우 참고 가능