'use client'

/**
 * 확인 대화상자 컴포넌트 (WCAG 2.1 준수)
 * Local App 디자인 가이드라인 적용
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {boolean} props.isOpen - 다이얼로그 열림 상태
 * @param {string} props.title - 대화상자 제목
 * @param {string} [props.message] - 메시지 내용
 * @param {React.ReactNode} [props.children] - 자식 컴포넌트
 * @param {string} [props.confirmText='확인'] - 확인 버튼 텍스트
 * @param {string} [props.cancelText='취소'] - 취소 버튼 텍스트
 * @param {'primary'|'danger'} [props.confirmVariant='primary'] - 확인 버튼 스타일
 * @param {Function} [props.onConfirm] - 확인 콜백
 * @param {Function} [props.onCancel] - 취소 콜백
 * @param {boolean} [props.showCloseButton=true] - 닫기 버튼 표시 여부
 * @param {boolean} [props.closeOnBackdrop=true] - 배경 클릭으로 닫기 가능 여부
 * @param {boolean} [props.loading=false] - 로딩 상태
 */

import { useEffect, useRef } from 'react'

const ConfirmDialog = ({
  isOpen = false,
  title,
  message,
  children,
  confirmText = '확인',
  cancelText = '취소',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  showCloseButton = true,
  closeOnBackdrop = true,
  loading = false
}) => {
  const dialogRef = useRef(null)
  const cancelButtonRef = useRef(null)

  // 포커스 관리 및 키보드 이벤트
  useEffect(() => {
    if (isOpen) {
      // 다이얼로그가 열릴 때 취소 버튼에 포커스
      cancelButtonRef.current?.focus()

      // ESC 키 이벤트 리스너
      const handleEscKey = (event) => {
        if (event.key === 'Escape') {
          onCancel?.()
        }
      }

      // 탭 순환 제한 (포커스 트랩)
      const handleTabKey = (event) => {
        if (event.key === 'Tab') {
          const focusableElements = dialogRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          const firstElement = focusableElements?.[0]
          const lastElement = focusableElements?.[focusableElements.length - 1]

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement?.focus()
              event.preventDefault()
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement?.focus()
              event.preventDefault()
            }
          }
        }
      }

      document.addEventListener('keydown', handleEscKey)
      document.addEventListener('keydown', handleTabKey)

      // 바디 스크롤 방지
      document.body.style.overflow = 'hidden'

      return () => {
        document.removeEventListener('keydown', handleEscKey)
        document.removeEventListener('keydown', handleTabKey)
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, onCancel])

  // 배경 클릭 처리
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && closeOnBackdrop) {
      onCancel?.()
    }
  }

  // 확인 버튼 스타일
  const getConfirmButtonStyles = () => {
    const baseStyles = 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 ease-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    if (confirmVariant === 'danger') {
      return `${baseStyles} bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-lg hover:shadow-xl`
    }
    
    return `${baseStyles} bg-gradient-to-r from-[#2AC1BC] to-[#3ec8c3] text-white hover:from-[#1FA09C] hover:to-[#2AC1BC] focus:ring-[#2AC1BC] shadow-lg hover:shadow-xl`
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />
      
      {/* 다이얼로그 */}
      <div 
        ref={dialogRef}
        className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full mx-4 transform transition-all duration-300 ease-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 
                id="dialog-title"
                className="text-xl font-bold text-gray-900 leading-tight"
              >
                {title}
              </h2>
            </div>
            
            {showCloseButton && (
              <button
                onClick={onCancel}
                className="ml-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-1"
                aria-label="대화상자 닫기"
                type="button"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 본문 */}
        <div className="px-6 pb-6">
          {message && (
            <p 
              id="dialog-description"
              className="text-gray-600 leading-relaxed mb-6"
            >
              {message}
            </p>
          )}
          
          {children && (
            <div className="mb-6">
              {children}
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              ref={cancelButtonRef}
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {cancelText}
            </button>
            
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`${getConfirmButtonStyles()} disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              type="button"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  처리중...
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 미리 정의된 확인 대화상자들
export const ConfirmDialogVariants = {
  // 삭제 확인
  Delete: ({ itemName, ...props }) => (
    <ConfirmDialog
      title="삭제 확인"
      message={`${itemName ? `"${itemName}"을(를) ` : ''}정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
      confirmText="삭제"
      confirmVariant="danger"
      {...props}
    />
  ),
  
  // 저장 확인
  Save: ({ ...props }) => (
    <ConfirmDialog
      title="변경사항 저장"
      message="변경된 내용을 저장하시겠습니까?"
      confirmText="저장"
      {...props}
    />
  ),
  
  // 취소 확인
  Cancel: ({ hasChanges = false, ...props }) => (
    <ConfirmDialog
      title="작업 취소"
      message={hasChanges ? "변경된 내용이 있습니다. 정말 취소하시겠습니까?" : "작업을 취소하시겠습니까?"}
      confirmText="취소"
      cancelText="계속하기"
      confirmVariant="danger"
      {...props}
    />
  )
}

// Local App 전용 확인 대화상자들
export const DeliveryConfirmDialogs = {
  // 주문 취소 확인
  CancelOrder: ({ orderNumber, ...props }) => (
    <ConfirmDialog
      title="주문 취소 확인"
      message={`주문번호 #${orderNumber}을(를) 취소하시겠습니까? 취소된 주문은 복구할 수 없습니다.`}
      confirmText="주문 취소"
      confirmVariant="danger"
      {...props}
    />
  ),
  
  // POS 연결 해제 확인
  DisconnectPOS: ({ ...props }) => (
    <ConfirmDialog
      title="POS 연결 해제"
      message="POS 시스템과의 연결을 해제하시겠습니까? 실시간 주문 처리가 중단됩니다."
      confirmText="연결 해제"
      confirmVariant="danger"
      {...props}
    />
  ),
  
  // 매장 휴업 확인
  CloseStore: ({ ...props }) => (
    <ConfirmDialog
      title="매장 휴업 설정"
      message="매장을 휴업 상태로 변경하시겠습니까? 고객에게 휴업 상태로 표시됩니다."
      confirmText="휴업 설정"
      confirmVariant="danger"
      {...props}
    />
  ),
  
  // 메뉴 품절 확인
  MarkOutOfStock: ({ menuName, ...props }) => (
    <ConfirmDialog
      title="품절 처리 확인"
      message={`"${menuName}"을(를) 품절 처리하시겠습니까?`}
      confirmText="품절 처리"
      {...props}
    />
  )
}

export default ConfirmDialog