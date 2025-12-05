/**
 * 이미지 업로드 컴포넌트 (점주용)
 * 접근성 지원, 드래그앤드롭, WCAG 2.1 준수, Local 테마 적용
 */
'use client';

import React, { useState, useRef, useCallback } from 'react';

const ImageUpload = ({
  id,
  name,
  value,
  onChange,
  onError,
  accept = 'image/*',
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 1,
  preview = true,
  dragAndDrop = true,
  disabled = false,
  required = false,
  className = '',
  uploadAreaClassName = '',
  previewClassName = '',
  label = '이미지 업로드',
  placeholder = '이미지를 선택하거나 드래그하여 업로드하세요',
  uploadButtonText = '파일 선택',
  removeButtonText = '제거',
  errorMessages = {
    fileSize: '파일 크기는 5MB 이하여야 합니다',
    fileType: '지원되지 않는 파일 형식입니다',
    maxFiles: '최대 파일 개수를 초과했습니다',
    uploadError: '파일 업로드 중 오류가 발생했습니다'
  },
  ...props
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState(value || []);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const uploadId = id || `image-upload-${Math.random().toString(36).substr(2, 9)}`;

  // 파일 유효성 검사
  const validateFile = (file) => {
    const errors = [];

    // 파일 크기 검사
    if (file.size > maxSize) {
      errors.push(errorMessages.fileSize);
    }

    // 파일 형식 검사
    if (!file.type.startsWith('image/')) {
      errors.push(errorMessages.fileType);
    }

    return errors;
  };

  // 파일 미리보기 생성
  const generatePreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          id: Math.random().toString(36).substr(2, 9),
          file,
          url: e.target.result,
          name: file.name,
          size: file.size
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // 파일 처리
  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const fileErrors = [];

    // 파일 개수 검사
    if (!multiple && fileArray.length > 1) {
      fileErrors.push(errorMessages.maxFiles);
      setErrors(fileErrors);
      if (onError) onError(fileErrors);
      return;
    }

    if (multiple && uploadedFiles.length + fileArray.length > maxFiles) {
      fileErrors.push(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다`);
      setErrors(fileErrors);
      if (onError) onError(fileErrors);
      return;
    }

    // 각 파일 유효성 검사
    for (const file of fileArray) {
      const validation = validateFile(file);
      if (validation.length === 0) {
        validFiles.push(file);
      } else {
        fileErrors.push(...validation);
      }
    }

    if (fileErrors.length > 0) {
      setErrors(fileErrors);
      if (onError) onError(fileErrors);
      return;
    }

    setIsUploading(true);
    setErrors([]);

    try {
      // 미리보기 생성
      const newPreviews = await Promise.all(
        validFiles.map(file => generatePreview(file))
      );

      if (multiple) {
        setUploadedFiles(prev => [...prev, ...validFiles]);
        setPreviews(prev => [...prev, ...newPreviews]);
        if (onChange) onChange([...uploadedFiles, ...validFiles]);
      } else {
        setUploadedFiles(validFiles);
        setPreviews(newPreviews);
        if (onChange) onChange(validFiles[0] || null);
      }
    } catch (error) {
      const uploadError = [errorMessages.uploadError];
      setErrors(uploadError);
      if (onError) onError(uploadError);
    } finally {
      setIsUploading(false);
    }
  };

  // 파일 제거
  const removeFile = (index) => {
    if (multiple) {
      const newFiles = uploadedFiles.filter((_, i) => i !== index);
      const newPreviews = previews.filter((_, i) => i !== index);
      setUploadedFiles(newFiles);
      setPreviews(newPreviews);
      if (onChange) onChange(newFiles);
    } else {
      setUploadedFiles([]);
      setPreviews([]);
      if (onChange) onChange(null);
    }
    
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && dragAndDrop) {
      setIsDragOver(true);
    }
  }, [disabled, dragAndDrop]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || !dragAndDrop) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, dragAndDrop]);

  // 업로드 영역 클릭 핸들러
  const handleUploadAreaClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 키보드 접근성
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleUploadAreaClick();
    }
  };

  return (
    <div className={`image-upload ${className}`} {...props}>
      {label && (
        <label 
          htmlFor={uploadId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="필수 항목">*</span>
          )}
        </label>
      )}

      {/* 업로드 영역 */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg transition-colors
          ${isDragOver
            ? 'border-vietnam-mint bg-vietnam-mint bg-opacity-5'
            : errors.length > 0
              ? 'border-red-300 dark:border-red-600'
              : 'border-gray-300 dark:border-gray-600 hover:border-vietnam-mint'
          }
          ${disabled ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'cursor-pointer'}
          ${uploadAreaClassName}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadAreaClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label={placeholder}
        aria-describedby={errors.length > 0 ? `${uploadId}-error` : undefined}
      >
        <input
          ref={fileInputRef}
          id={uploadId}
          name={name}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="sr-only"
          aria-describedby={errors.length > 0 ? `${uploadId}-error` : undefined}
        />

        <div className="flex flex-col items-center justify-center py-12 px-6">
          {isUploading ? (
            <>
              <svg className="w-12 h-12 text-vietnam-mint animate-spin mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">업로드 중...</p>
            </>
          ) : (
            <>
              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
                {placeholder}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                최대 {Math.round(maxSize / 1024 / 1024)}MB, {accept}
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-vietnam-mint hover:bg-teal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={disabled}
              >
                {uploadButtonText}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {errors.length > 0 && (
        <div id={`${uploadId}-error`} className="mt-2">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600 dark:text-red-400 flex items-center">
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          ))}
        </div>
      )}

      {/* 미리보기 */}
      {preview && previews.length > 0 && (
        <div className={`mt-4 ${previewClassName}`}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((item, index) => (
              <div key={item.id} className="relative group">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={item.url}
                    alt={`업로드된 이미지 ${index + 1}: ${item.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-60 text-white text-xs p-2 rounded-b-lg">
                  <p className="truncate" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-gray-300">
                    {(item.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label={`${item.name} 제거`}
                  title={removeButtonText}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;