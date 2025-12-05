'use client';
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '@/shared/i18n';

const ERROR_ICONS = {
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  success: CheckCircleIcon
};

const ERROR_STYLES = {
  error: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-500'
  },
  warning: {
    container: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700',
    text: 'text-amber-800 dark:text-amber-200',
    icon: 'text-amber-500'
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-500'
  },
  success: {
    container: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700',
    text: 'text-emerald-800 dark:text-emerald-200',
    icon: 'text-emerald-500'
  }
};

export function ValidationErrorItem({ error, className = '' }) {
  const { t } = useTranslation();
  const severity = error.severity || 'error';
  const Icon = ERROR_ICONS[severity];
  const styles = ERROR_STYLES[severity];

  // 메시지가 번역 키인지 확인 (콜론 포함 여부로 판단)
  // 예: "menu:validation.optionGroupMinOptions"
  const isTranslationKey = error.message && error.message.includes(':');
  const displayMessage = isTranslationKey ? t(error.message) : error.message;

  return (
    <div className={`flex items-start gap-2 p-3 border rounded-lg ${styles.container} ${className}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
      <div className={`text-sm ${styles.text}`}>
        <p>{displayMessage}</p>
        {error.suggestion && (
          <p className="mt-1 text-xs opacity-75">
            💡 {error.suggestion}
          </p>
        )}
      </div>
    </div>
  );
}

export function ValidationErrorList({ errors = [], title, className = '' }) {
  if (!errors || errors.length === 0) return null;

  const errorsByType = errors.reduce((acc, error) => {
    const severity = error.severity || 'error';
    acc[severity] = acc[severity] || [];
    acc[severity].push(error);
    return acc;
  }, {});

  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h4 className="font-medium text-gray-900 dark:text-white">
          {title}
        </h4>
      )}
      
      <div className="space-y-2">
        {/* 에러 먼저 표시 */}
        {errorsByType.error?.map((error, index) => (
          <ValidationErrorItem key={`error-${index}`} error={error} />
        ))}
        
        {/* 경고 표시 */}
        {errorsByType.warning?.map((error, index) => (
          <ValidationErrorItem key={`warning-${index}`} error={error} />
        ))}
        
        {/* 정보 표시 */}
        {errorsByType.info?.map((error, index) => (
          <ValidationErrorItem key={`info-${index}`} error={error} />
        ))}
      </div>
    </div>
  );
}

export function ValidationSummary({ 
  errorStats, 
  validationHistory = [], 
  onScrollToError,
  className = '' 
}) {
  if (!errorStats || errorStats.total === 0) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg ${className}`}>
        <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
        <div className="flex-1">
          <h4 className="font-medium text-emerald-800 dark:text-emerald-200">
            모든 입력이 올바릅니다! ✨
          </h4>
          <p className="text-sm text-emerald-600 dark:text-emerald-300">
            메뉴를 저장할 준비가 완료되었습니다.
          </p>
        </div>
      </div>
    );
  }

  const hasErrors = errorStats.hasErrors;
  const hasWarnings = errorStats.hasWarnings;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 요약 정보 */}
      <div className={`flex items-center justify-between p-4 border rounded-lg ${
        hasErrors 
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
          : hasWarnings
          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
      }`}>
        <div className="flex items-center gap-3">
          {hasErrors ? (
            <XCircleIcon className="w-6 h-6 text-red-500" />
          ) : hasWarnings ? (
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />
          ) : (
            <InformationCircleIcon className="w-6 h-6 text-blue-500" />
          )}
          
          <div>
            <h4 className={`font-medium ${
              hasErrors 
                ? 'text-red-800 dark:text-red-200'
                : hasWarnings 
                ? 'text-amber-800 dark:text-amber-200'
                : 'text-blue-800 dark:text-blue-200'
            }`}>
              {hasErrors ? '⚠️ 수정이 필요한 항목이 있습니다' : 
               hasWarnings ? '⚠️ 확인이 필요한 항목이 있습니다' : 
               'ℹ️ 입력 상태 확인'}
            </h4>
            <div className={`text-sm ${
              hasErrors 
                ? 'text-red-600 dark:text-red-300'
                : hasWarnings 
                ? 'text-amber-600 dark:text-amber-300'
                : 'text-blue-600 dark:text-blue-300'
            }`}>
              {errorStats.errors > 0 && (
                <span>오류 {errorStats.errors}개</span>
              )}
              {errorStats.errors > 0 && errorStats.warnings > 0 && <span>, </span>}
              {errorStats.warnings > 0 && (
                <span>경고 {errorStats.warnings}개</span>
              )}
            </div>
          </div>
        </div>
        
        {hasErrors && onScrollToError && (
          <button
            onClick={onScrollToError}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700 rounded-lg transition-colors"
          >
            첫 번째 오류로 이동
          </button>
        )}
      </div>

      {/* 검증 진행률 */}
      {validationHistory.length > 0 && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">검증 진행률</span>
            <span className={`font-medium ${
              hasErrors ? 'text-red-600' : hasWarnings ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {Math.round(((errorStats.total - errorStats.errors) / Math.max(errorStats.total, 1)) * 100)}%
            </span>
          </div>
          
          {/* 진행률 바 */}
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                hasErrors ? 'bg-red-500' : hasWarnings ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.round(((errorStats.total - errorStats.errors) / Math.max(errorStats.total, 1)) * 100)}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function FieldValidationError({ field, errors = [], className = '' }) {
  const { t } = useTranslation();
  const fieldErrors = Array.isArray(errors) ? errors : [errors];
  const hasError = fieldErrors.some(e => e.severity === 'error');
  const hasWarning = fieldErrors.some(e => e.severity === 'warning');

  if (fieldErrors.length === 0) return null;

  return (
    <div className={`mt-1 space-y-1 ${className}`}>
      {fieldErrors.map((error, index) => {
        // 메시지가 번역 키인지 확인 (콜론 포함 여부로 판단)
        const isTranslationKey = error.message && error.message.includes(':');
        const displayMessage = isTranslationKey ? t(error.message) : error.message;

        return (
          <div key={index} className={`flex items-center gap-2 text-sm ${
            error.severity === 'error'
              ? 'text-red-600 dark:text-red-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}>
            {error.severity === 'error' ? (
              <XCircleIcon className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{displayMessage}</span>
          </div>
        );
      })}
    </div>
  );
}

// Form Field 래퍼 컴포넌트
export function ValidatedFormField({
  field,
  errors = [],
  children,
  label,
  required,
  className = ''
}) {
  const hasError = errors.some?.(e => e && (e.severity === 'error' || !e.severity));
  const hasWarning = errors.some?.(e => e && e.severity === 'warning');

  return (
    <div className={`${className}`} data-field={field}>
      {label && (
        <label className={`block text-sm font-medium mb-2 ${
          hasError
            ? 'text-red-700 dark:text-red-300'
            : hasWarning
            ? 'text-amber-700 dark:text-amber-300'
            : 'text-gray-700 dark:text-gray-300'
        }`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* ✅ ring 대신 border로 변경하여 명확한 빨간색 테두리 표시 */}
      <div className={`rounded-lg ${
        hasError
          ? 'border-2 border-red-500 dark:border-red-400'
          : hasWarning
          ? 'border-2 border-amber-500 dark:border-amber-400'
          : ''
      }`}>
        {children}
      </div>

      <FieldValidationError errors={errors} />
    </div>
  );
}