'use client'

/**
 * 로딩 스피너 컴포넌트 (WCAG 2.1 준수)
 * Local App 디자인 가이드라인 적용
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {'small'|'medium'|'large'|'fullscreen'} [props.size='medium'] - 로딩 크기
 * @param {'primary'|'secondary'|'white'} [props.color='primary'] - 로딩 색상
 * @param {string} [props.text] - 로딩 텍스트
 * @param {boolean} [props.overlay=false] - 오버레이 표시 여부
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {boolean} [props.inline=false] - 인라인 표시 여부
 */

const Loading = ({
  size = 'medium',
  color = 'primary',
  text,
  overlay = false,
  className = '',
  inline = false
}) => {
  // 크기별 스타일 설정
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          spinner: 'w-4 h-4',
          container: 'gap-2',
          text: 'text-sm'
        }
      case 'medium':
        return {
          spinner: 'w-8 h-8',
          container: 'gap-3',
          text: 'text-base'
        }
      case 'large':
        return {
          spinner: 'w-12 h-12',
          container: 'gap-4',
          text: 'text-lg'
        }
      case 'fullscreen':
        return {
          spinner: 'w-16 h-16',
          container: 'gap-6',
          text: 'text-xl'
        }
      default:
        return {
          spinner: 'w-8 h-8',
          container: 'gap-3',
          text: 'text-base'
        }
    }
  }

  // 색상별 스타일 설정
  const getColorStyles = () => {
    switch (color) {
      case 'primary':
        return 'text-[#2AC1BC]'
      case 'secondary':
        return 'text-[#00B14F]'
      case 'white':
        return 'text-white'
      default:
        return 'text-[#2AC1BC]'
    }
  }

  // 스피너 SVG 컴포넌트
  const Spinner = () => {
    const styles = getSizeStyles()
    const colorClass = getColorStyles()

    return (
      <svg 
        className={`${styles.spinner} animate-spin ${colorClass}`}
        fill="none" 
        viewBox="0 0 24 24"
        role="img"
        aria-label="로딩 중"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    )
  }

  // Local 민트 그라데이션 스피너
  const GradientSpinner = () => {
    const styles = getSizeStyles()

    return (
      <div className={`${styles.spinner} relative animate-spin`} role="img" aria-label="로딩 중">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] opacity-25" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#2AC1BC] to-[#00B14F]" 
             style={{
               background: 'conic-gradient(from 0deg, #2AC1BC, #00B14F, transparent)',
               borderRadius: '50%'
             }}
        />
        <div className="absolute inset-1 rounded-full bg-white" />
      </div>
    )
  }

  // 펄스 로딩 애니메이션
  const PulseSpinner = () => {
    const styles = getSizeStyles()
    const colorClass = getColorStyles()

    return (
      <div className={`${styles.container} flex items-center justify-center`}>
        <div className={`${styles.spinner} relative ${colorClass}`}>
          <div className="absolute inset-0 rounded-full animate-ping opacity-75 bg-current" />
          <div className="relative rounded-full bg-current" style={{ width: '60%', height: '60%', margin: '20%' }} />
        </div>
      </div>
    )
  }

  // 컨테이너 스타일
  const getContainerClass = () => {
    const styles = getSizeStyles()
    let baseClass = `flex items-center justify-center ${styles.container} ${className}`
    
    if (inline) {
      baseClass += ' inline-flex'
    } else if (size === 'fullscreen') {
      baseClass += ' min-h-screen flex-col'
    } else {
      baseClass += ' flex-col py-8'
    }

    return baseClass
  }

  // 오버레이 모드
  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 max-w-sm mx-4">
          <div className={getContainerClass()}>
            <GradientSpinner />
            {text && (
              <p className={`${getSizeStyles().text} font-medium text-gray-700 text-center mt-4`}>
                {text}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={getContainerClass()}
      role="status" 
      aria-live="polite"
      aria-busy="true"
    >
      {size === 'fullscreen' ? <GradientSpinner /> : <Spinner />}
      
      {text && (
        <p className={`${getSizeStyles().text} font-medium text-gray-700 text-center`}>
          {text}
        </p>
      )}
      
      {/* 스크린 리더용 텍스트 */}
      <span className="sr-only">
        {text || '로딩 중입니다. 잠시만 기다려주세요.'}
      </span>
    </div>
  )
}

// 미리 정의된 로딩 변형들
export const LoadingVariants = {
  // 버튼 내부 로딩
  Button: (props) => (
    <Loading size="small" inline={true} color="white" {...props} />
  ),
  
  // 페이지 로딩
  Page: (props) => (
    <Loading size="large" text="페이지를 불러오고 있습니다..." {...props} />
  ),
  
  // 전체화면 로딩
  Fullscreen: (props) => (
    <Loading size="fullscreen" overlay={true} text="잠시만 기다려주세요..." {...props} />
  ),
  
  // 카드 로딩
  Card: (props) => (
    <Loading size="medium" {...props} />
  ),
  
  // 인라인 로딩
  Inline: (props) => (
    <Loading size="small" inline={true} {...props} />
  )
}

// Local App 전용 로딩 컴포넌트들
export const DeliveryLoadings = {
  // 주문 처리 중
  ProcessingOrder: (props) => (
    <Loading 
      size="large" 
      text="주문을 처리하고 있습니다..." 
      overlay={true}
      {...props} 
    />
  ),
  
  // 결제 처리 중
  ProcessingPayment: (props) => (
    <Loading 
      size="large" 
      text="결제를 처리하고 있습니다..." 
      overlay={true}
      {...props} 
    />
  ),
  
  // POS 연결 중
  ConnectingPOS: (props) => (
    <Loading 
      size="medium" 
      text="POS 시스템에 연결하고 있습니다..." 
      {...props} 
    />
  ),
  
  // 메뉴 불러오는 중
  LoadingMenu: (props) => (
    <Loading 
      size="medium" 
      text="메뉴를 불러오고 있습니다..." 
      {...props} 
    />
  ),
  
  // 주문 내역 불러오는 중
  LoadingOrders: (props) => (
    <Loading 
      size="medium" 
      text="주문 내역을 불러오고 있습니다..." 
      {...props} 
    />
  ),
  
  // 실시간 데이터 동기화 중
  SyncingData: (props) => (
    <Loading 
      size="small" 
      text="데이터를 동기화하고 있습니다..." 
      inline={true}
      {...props} 
    />
  )
}

// 스켈레톤 로딩 컴포넌트
export const SkeletonLoader = ({ 
  lines = 3, 
  height = '1rem', 
  spacing = '0.5rem',
  className = '' 
}) => {
  return (
    <div className={`animate-pulse space-y-2 ${className}`} role="status" aria-label="콘텐츠 로딩 중">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg bg-[length:200%_100%] animate-shimmer"
          style={{
            height,
            marginBottom: index < lines - 1 ? spacing : '0'
          }}
        />
      ))}
      <span className="sr-only">콘텐츠를 불러오고 있습니다...</span>
    </div>
  )
}

export { Loading };
export default Loading;