/**
 * UploadProgressModal - 이미지 업로드 진행 상태 표시 모달
 * EnhancedModal 기반으로 구현
 */

import EnhancedModal from './EnhancedModal';
import { useTranslation } from '@/shared/i18n';

const UploadProgressModal = ({
  isOpen,
  currentStep,
  totalSteps,
  currentStepName,
  progress,
  onClose
}) => {
  const { t } = useTranslation();

  // 전체 진행률 계산 (0-100)
  const overallProgress = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('menu:upload.progressTitle')}
      size="md"
      closeOnBackdrop={false} // 업로드 중에는 백드롭 클릭으로 닫기 금지
      closeOnEsc={false}       // ESC로 닫기 금지
      showCloseButton={false}  // X 버튼 숨김
    >
      <div className="space-y-6">
        {/* 현재 작업 설명 */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {currentStepName || t('menu:upload.processing')}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('menu:upload.stepProgress', { current: currentStep, total: totalSteps })}
          </p>
        </div>

        {/* 프로그레스 바 */}
        <div className="space-y-2">
          {/* 프로그레스 바 컨테이너 */}
          <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {/* 진행 바 (애니메이션) */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${overallProgress}%` }}
            >
              {/* 반짝임 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* 진행률 표시 */}
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-primary-600 dark:text-primary-400">
              {overallProgress}%
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {currentStep} / {totalSteps}
            </span>
          </div>
        </div>

        {/* 로딩 스피너 */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>

        {/* 경고 메시지 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
            ⚠️ {t('menu:upload.warning')}
          </p>
        </div>
      </div>
    </EnhancedModal>
  );
};

export default UploadProgressModal;

// Tailwind 애니메이션 추가 (tailwind.config.js에 추가 필요)
// animation: {
//   shimmer: 'shimmer 2s infinite',
// },
// keyframes: {
//   shimmer: {
//     '0%': { transform: 'translateX(-100%)' },
//     '100%': { transform: 'translateX(100%)' },
//   },
// },
