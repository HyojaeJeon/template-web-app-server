'use client'

import { forwardRef, useState, useRef } from 'react'

/**
 * FileInput - 파일 입력 컴포넌트 (WCAG 2.1 준수)
 * 스크린 리더 지원 및 접근성 강화
 * 다크 테마 지원
 */
const FileInput = forwardRef(({
  label,
  accept,
  multiple = false,
  maxSize = 10485760, // 10MB
  maxFiles = 5,
  onChange,
  onError,
  disabled = false,
  required = false,
  helperText,
  errorMessage,
  className = '',
  ...props
}, ref) => {
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const combinedRef = ref || inputRef

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // 파일 유효성 검사
  const validateFiles = (fileList) => {
    const filesArray = Array.from(fileList)
    
    // 파일 개수 제한
    if (multiple && filesArray.length > maxFiles) {
      const error = `최대 ${maxFiles}개의 파일만 선택 가능합니다`
      setError(error)
      onError?.(error)
      return false
    }

    // 파일 크기 제한
    const oversizedFiles = filesArray.filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      const error = `파일 크기는 ${formatFileSize(maxSize)}를 초과할 수 없습니다`
      setError(error)
      onError?.(error)
      return false
    }

    setError('')
    return true
  }

  // 파일 선택 처리
  const handleFileChange = (e) => {
    const selectedFiles = e.target.files
    if (validateFiles(selectedFiles)) {
      const filesArray = Array.from(selectedFiles)
      setFiles(filesArray)
      onChange?.(multiple ? filesArray : filesArray[0])
    }
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
      if (validateFiles(e.dataTransfer.files)) {
        const filesArray = Array.from(e.dataTransfer.files)
        setFiles(filesArray)
        onChange?.(multiple ? filesArray : filesArray[0])
      }
    }
  }

  // 파일 제거
  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onChange?.(multiple ? newFiles : newFiles[0])
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

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-xl p-6
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
        aria-label={label || '파일 선택'}
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
          onChange={handleFileChange}
          disabled={disabled}
          className="sr-only"
          aria-describedby={`${props.id}-description`}
          {...props}
        />

        <div className="text-center">
          {/* 업로드 아이콘 */}
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">클릭하여 파일 선택</span> 또는 드래그하여 업로드
          </p>
          
          <p 
            id={`${props.id}-description`}
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            {accept && `지원 형식: ${accept}`}
            {maxSize && ` • 최대 크기: ${formatFileSize(maxSize)}`}
            {multiple && ` • 최대 ${maxFiles}개`}
          </p>
        </div>
      </div>

      {/* 선택된 파일 목록 */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2" role="list" aria-label="선택된 파일 목록">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              role="listitem"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <svg 
                  className="w-5 h-5 text-gray-400 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(index)
                }}
                className="ml-4 p-1 text-gray-400 hover:text-red-500 transition-colors"
                aria-label={`${file.name} 제거`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

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

// Local App 특화 문서 업로드
export const DocumentUpload = ({ 
  onUpload,
  acceptedTypes = '.pdf,.doc,.docx,.jpg,.svg',
  className = '',
  ...props 
}) => {
  const documentTypes = {
    '.pdf': { icon: '📄', color: 'text-red-500' },
    '.doc': { icon: '📝', color: 'text-blue-500' },
    '.docx': { icon: '📝', color: 'text-blue-500' },
    '.jpg': { icon: '🖼️', color: 'text-green-500' },
    '.svg': { icon: '🖼️', color: 'text-green-500' }
  }

  return (
    <FileInput
      label="사업자 등록증 및 서류"
      accept={acceptedTypes}
      multiple={true}
      maxFiles={10}
      maxSize={5242880} // 5MB
      onChange={onUpload}
      helperText="사업자등록증, 통장사본, 신분증 등을 업로드하세요"
      className={className}
      {...props}
    />
  )
}

FileInput.displayName = 'FileInput'

export default FileInput