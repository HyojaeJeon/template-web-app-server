'use client'

import { forwardRef, useState, useRef, useEffect } from 'react'

/**
 * ImageUpload - 이미지 업로드 컴포넌트 (WCAG 2.1 준수)
 * 미리보기 및 드래그앤드롭 지원
 * 다크 테마 지원
 */
const ImageUpload = forwardRef(({
  label,
  multiple = false,
  maxSize = 5242880, // 5MB
  maxFiles = 5,
  accept = 'image/*',
  onChange,
  onError,
  value,
  disabled = false,
  required = false,
  helperText,
  errorMessage,
  aspectRatio,
  showPreview = true,
  className = '',
  ...props
}, ref) => {
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const combinedRef = ref || inputRef

  // 초기 이미지 설정
  useEffect(() => {
    if (value) {
      const valueArray = Array.isArray(value) ? value : [value]
      setImages(valueArray)
      
      // URL 문자열인 경우 그대로 사용, File 객체인 경우 미리보기 생성
      const previewUrls = valueArray.map(img => {
        if (typeof img === 'string') return img
        return URL.createObjectURL(img)
      })
      setPreviews(previewUrls)
    }
  }, [value])

  // 컴포넌트 언마운트 시 미리보기 URL 정리
  useEffect(() => {
    return () => {
      previews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview)
        }
      })
    }
  }, [previews])

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // 이미지 유효성 검사
  const validateImages = (fileList) => {
    const filesArray = Array.from(fileList)
    
    // 파일 개수 제한
    if (multiple && filesArray.length > maxFiles) {
      const error = `최대 ${maxFiles}개의 이미지만 선택 가능합니다`
      setError(error)
      onError?.(error)
      return false
    }

    // 파일 크기 제한
    const oversizedFiles = filesArray.filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      const error = `이미지 크기는 ${formatFileSize(maxSize)}를 초과할 수 없습니다`
      setError(error)
      onError?.(error)
      return false
    }

    // 이미지 파일 타입 확인
    const invalidFiles = filesArray.filter(file => !file.type.startsWith('image/'))
    if (invalidFiles.length > 0) {
      const error = '이미지 파일만 업로드 가능합니다'
      setError(error)
      onError?.(error)
      return false
    }

    setError('')
    return true
  }

  // 이미지 선택 처리
  const handleImageChange = (e) => {
    const selectedFiles = e.target.files
    if (validateImages(selectedFiles)) {
      processImages(Array.from(selectedFiles))
    }
  }

  // 이미지 처리 및 미리보기 생성
  const processImages = (filesArray) => {
    setImages(filesArray)
    
    // 미리보기 URL 생성
    const newPreviews = filesArray.map(file => URL.createObjectURL(file))
    
    // 이전 미리보기 URL 정리
    previews.forEach(preview => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    })
    
    setPreviews(newPreviews)
    onChange?.(multiple ? filesArray : filesArray[0])
  }

  // 드래그 이벤트 처리
  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (!disabled && e.dataTransfer.files.length > 0) {
      if (validateImages(e.dataTransfer.files)) {
        processImages(Array.from(e.dataTransfer.files))
      }
    }
  }

  // 이미지 제거
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = previews.filter((preview, i) => {
      if (i === index && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
      return i !== index
    })
    
    setImages(newImages)
    setPreviews(newPreviews)
    onChange?.(multiple ? newImages : newImages[0])
  }

  // 파일 선택 영역 클릭
  const handleClick = () => {
    if (!disabled) {
      combinedRef.current?.click()
    }
  }

  const hasError = error || errorMessage

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label 
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* 이미지 미리보기 */}
      {showPreview && previews.length > 0 && (
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800"
            >
              <img
                src={preview}
                alt={`미리보기 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  aria-label={`이미지 ${index + 1} 제거`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 업로드 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-xl p-8
          transition-all duration-200 cursor-pointer
          ${isDragging 
            ? 'border-[#2AC1BC] bg-[#2AC1BC]/5' 
            : hasError
              ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-[#2AC1BC] dark:hover:border-[#2AC1BC]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        role="button"
        aria-label={label || '이미지 선택'}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        <input
          ref={combinedRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleImageChange}
          disabled={disabled}
          className="sr-only"
          aria-describedby={`${props.id}-description`}
          {...props}
        />

        <div className="text-center">
          {/* 이미지 아이콘 */}
          <svg 
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-[#2AC1BC]">클릭하여 이미지 선택</span> 또는 드래그하여 업로드
          </p>
          
          <p 
            id={`${props.id}-description`}
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            JPG, PNG, GIF, WEBP • 최대 {formatFileSize(maxSize)}
            {multiple && ` • 최대 ${maxFiles}개`}
          </p>
        </div>
      </div>

      {/* 도움말 및 에러 메시지 */}
      {(helperText || hasError) && (
        <div className="mt-2">
          {hasError ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error || errorMessage}
            </p>
          ) : helperText && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  )
})

// Local App 메뉴 이미지 업로드
export const MenuImageUpload = ({ 
  onUpload,
  currentImage,
  className = '',
  ...props 
}) => {
  return (
    <ImageUpload
      label="메뉴 이미지"
      accept="image/jpeg,image/jpg,image/png,image/webp"
      maxSize={3145728} // 3MB
      value={currentImage}
      onChange={onUpload}
      helperText="메뉴 사진을 업로드하세요 (권장: 1:1 비율)"
      aspectRatio="1:1"
      className={className}
      {...props}
    />
  )
}

// 매장 로고 업로드
export const StoreLogoUpload = ({ 
  onUpload,
  currentLogo,
  className = '',
  ...props 
}) => {
  return (
    <div className={className}>
      <ImageUpload
        label="매장 로고"
        accept="image/jpeg,image/jpg,image/png,image/svg+xml"
        maxSize={2097152} // 2MB
        value={currentLogo}
        onChange={onUpload}
        helperText="정사각형 로고를 권장합니다"
        showPreview={true}
        {...props}
      />
      <div className="mt-2 p-3 bg-[#2AC1BC]/10 rounded-lg">
        <p className="text-xs text-[#2AC1BC] flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          로고는 앱 상단과 주문서에 표시됩니다
        </p>
      </div>
    </div>
  )
}

ImageUpload.displayName = 'ImageUpload'

export default ImageUpload