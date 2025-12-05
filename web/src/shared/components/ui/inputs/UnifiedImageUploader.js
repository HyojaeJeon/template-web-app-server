/**
 * 통합 이미지 업로더 UI 컴포넌트
 * useImageUpload 훅 기반
 * 단일/다중 이미지 업로드, 드래그 앤 드롭, 정렬, 이미지 확대 보기, 1:1 크롭 지원
 */
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  PhotoIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassPlusIcon,
  CheckIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useTranslation } from '@/shared/i18n';
import { useImageUpload } from '@/hooks/useImageUpload';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Lightbox 이미지 뷰어
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

// 이미지 크롭
import { Cropper } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import EnhancedModal from '@/shared/components/ui/modals/EnhancedModal';

// File 객체를 썸네일 이미지로 표시하는 컴포넌트
const ImageThumbnail = ({ file }) => {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!file) return;

    // File 객체를 URL로 변환
    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);

    // 컴포넌트 언마운트 시 메모리 해제
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!src) {
    return (
      <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
        <PhotoIcon className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Thumbnail"
      className="w-full h-full object-cover"
    />
  );
};

// Sortable 이미지 아이템
const SortableImageItem = ({
  image,
  index,
  onRemove,
  onSetPrimary,
  onMoveUp,
  onMoveDown,
  onImageClick,
  disabled,
  uploading,
  t,
  totalImages,
  showPrimary = true,
  aspectRatio = 1
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.cloudflareId || image.base64 || `img-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50' : 'z-0'}`}
    >
      {/* 드래그 핸들 */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-move"
      >
        {/* aspectRatio에 따라 동적 높이 적용: padding-bottom 퍼센트 기법 사용 */}
        <div
          className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
          style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
        >
          <img
            src={image.base64 || image.url}
            alt={image.alt || `이미지 ${index + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* 대표 이미지 배지 */}
        {showPrimary && image.isPrimary && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 z-10">
            <StarIconSolid className="w-3 h-3" />
            {t('menu.multiImageUploader.primary')}
          </div>
        )}

        {/* 순서 표시 */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-semibold z-10">
          {index + 1}
        </div>
      </div>

      {/* 액션 버튼 */}
      {!isDragging && (
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1 z-20">
          {/* 확대 보기 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(index);
            }}
            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            aria-label={t('menu.imageUploader.viewImage')}
            title={t('menu.imageUploader.viewImage')}
          >
            <MagnifyingGlassPlusIcon className="w-4 h-4" />
          </button>

          {/* 순서 변경 */}
          {index > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onMoveUp();
              }}
              disabled={disabled || uploading}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              aria-label="위로 이동"
              title="위로 이동"
            >
              <ArrowUpIcon className="w-4 h-4" />
            </button>
          )}
          {index < totalImages - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onMoveDown();
              }}
              disabled={disabled || uploading}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              aria-label="아래로 이동"
              title="아래로 이동"
            >
              <ArrowDownIcon className="w-4 h-4" />
            </button>
          )}

          {/* 대표 이미지 설정 */}
          {showPrimary && !image.isPrimary && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onSetPrimary(index);
              }}
              disabled={disabled || uploading}
              className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              aria-label="대표 이미지로 설정"
              title="대표 이미지로 설정"
            >
              <StarIcon className="w-4 h-4" />
            </button>
          )}

          {/* 삭제 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onRemove(index);
            }}
            disabled={disabled || uploading}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            aria-label="이미지 삭제"
            title="이미지 삭제"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const UnifiedImageUploader = ({
  disabled = false,
  showPrimary = true,
  error = null, // 에러 메시지
  className = '',
  enableCrop = true, // 크롭 활성화 여부
  aspectRatio = 1, // 크롭 비율 (기본: 1:1 정사각형)
  ...hookOptions
}) => {
  const { t } = useTranslation();
  const cropperRef = useRef(null);

  // Lightbox 상태
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 크롭 모달 상태
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);

  // 다중 이미지 크롭 상태
  const [croppedImages, setCroppedImages] = useState([]); // 크롭된 이미지 Base64 배열
  const [currentCropIndex, setCurrentCropIndex] = useState(0); // 현재 크롭 중인 인덱스
  const [originalFilesForCrop, setOriginalFilesForCrop] = useState([]); // 원본 파일들 (재크롭용)

  const {
    images,
    uploading,
    dragActive,
    uploadProgress,
    fileInputRef,
    handleFileSelect: originalHandleFileSelect,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop: originalHandleDrop,
    handleFiles,
    removeImage,
    setPrimaryImage,
    moveImage,
    openFileDialog,
    multiple,
    maxFiles,
    maxFileSize,
    acceptedFormats
  } = useImageUpload(hookOptions);

  // 크롭 모드일 때 파일 선택 처리 (크롭 모달 열기)
  const handleFileSelectWithCrop = useCallback((e) => {
    if (!enableCrop) {
      originalHandleFileSelect(e);
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // 다중 업로드 모드: 모든 파일을 원본으로 저장하고 크롭 상태 초기화
    if (multiple && fileArray.length > 0) {
      setOriginalFilesForCrop(fileArray);
      setCroppedImages(new Array(fileArray.length).fill(null)); // 크롭된 이미지 배열 초기화
      setCurrentCropIndex(0);
      setPendingFiles(fileArray);

      // 첫 번째 파일로 크롭 모달 열기
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImageForCrop(event.target.result);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(fileArray[0]);
    } else {
      // 단일 업로드 모드: 기존 로직 유지
      setPendingFiles(fileArray);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImageForCrop(event.target.result);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(fileArray[0]);
    }

    // input 초기화
    e.target.value = '';
  }, [enableCrop, originalHandleFileSelect, multiple]);

  // 드롭 이벤트 처리 (크롭 모드)
  const handleDropWithCrop = useCallback((e) => {
    if (!enableCrop) {
      originalHandleDrop(e);
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // 다중 업로드 모드: 모든 파일을 원본으로 저장하고 크롭 상태 초기화
    if (multiple && fileArray.length > 0) {
      setOriginalFilesForCrop(fileArray);
      setCroppedImages(new Array(fileArray.length).fill(null));
      setCurrentCropIndex(0);
      setPendingFiles(fileArray);

      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImageForCrop(event.target.result);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(fileArray[0]);
    } else {
      // 단일 업로드 모드
      setPendingFiles(fileArray);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImageForCrop(event.target.result);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(fileArray[0]);
    }
  }, [enableCrop, originalHandleDrop, multiple]);

  // 현재 이미지 크롭 저장 (다중 모드용)
  const handleSaveCurrentCrop = useCallback(() => {
    if (!cropperRef.current) return;

    const canvas = cropperRef.current.getCanvas();
    if (!canvas) return;

    // Canvas를 Base64로 변환하여 크롭된 이미지 리스트에 저장
    const base64 = canvas.toDataURL('image/jpeg', 0.9);

    // 새로운 croppedImages 배열 생성 (클로저 문제 해결)
    const newCroppedImages = [...croppedImages];
    newCroppedImages[currentCropIndex] = base64;
    setCroppedImages(newCroppedImages);

    // 다음 크롭되지 않은 이미지로 자동 이동 (업데이트된 배열 기준)
    const nextUncroppedIndex = newCroppedImages.findIndex((img, idx) => idx > currentCropIndex && img === null);
    if (nextUncroppedIndex !== -1 && originalFilesForCrop[nextUncroppedIndex]) {
      setCurrentCropIndex(nextUncroppedIndex);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImageForCrop(event.target.result);
      };
      reader.readAsDataURL(originalFilesForCrop[nextUncroppedIndex]);
    }
  }, [currentCropIndex, croppedImages, originalFilesForCrop]);

  // 특정 이미지 선택하여 크롭 영역으로 로드 (재수정용)
  const handleSelectImageForEdit = useCallback((index) => {
    if (!originalFilesForCrop[index]) return;

    // 현재 크롭 중인 이미지 먼저 저장
    if (cropperRef.current) {
      const canvas = cropperRef.current.getCanvas();
      if (canvas) {
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        setCroppedImages(prev => {
          const newCroppedImages = [...prev];
          newCroppedImages[currentCropIndex] = base64;
          return newCroppedImages;
        });
      }
    }

    setCurrentCropIndex(index);

    // 이미 크롭된 이미지가 있으면 크롭된 결과를 표시, 없으면 원본 로드
    if (croppedImages[index]) {
      setSelectedImageForCrop(croppedImages[index]);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImageForCrop(event.target.result);
      };
      reader.readAsDataURL(originalFilesForCrop[index]);
    }
  }, [currentCropIndex, originalFilesForCrop, croppedImages]);

  // 현재 이미지를 원본으로 되돌리기
  const handleResetToOriginal = useCallback(() => {
    if (!originalFilesForCrop[currentCropIndex]) return;

    // 크롭 기록 삭제
    setCroppedImages(prev => {
      const newCroppedImages = [...prev];
      newCroppedImages[currentCropIndex] = null;
      return newCroppedImages;
    });

    // 원본 이미지 로드
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImageForCrop(event.target.result);
    };
    reader.readAsDataURL(originalFilesForCrop[currentCropIndex]);
  }, [currentCropIndex, originalFilesForCrop]);

  // 다중 모드에서 특정 이미지 삭제
  const handleRemoveFromCropList = useCallback((index, e) => {
    e.stopPropagation(); // 클릭 이벤트 전파 방지

    if (originalFilesForCrop.length <= 1) return; // 최소 1개는 유지

    const newFiles = originalFilesForCrop.filter((_, i) => i !== index);
    const newCroppedImages = croppedImages.filter((_, i) => i !== index);

    setOriginalFilesForCrop(newFiles);
    setCroppedImages(newCroppedImages);

    // 현재 인덱스 조정
    if (index === currentCropIndex) {
      // 삭제된 이미지가 현재 편집 중이면 다음 이미지로 이동
      const newIndex = Math.min(index, newFiles.length - 1);
      setCurrentCropIndex(newIndex);

      // 새 이미지 로드
      if (newCroppedImages[newIndex]) {
        setSelectedImageForCrop(newCroppedImages[newIndex]);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          setSelectedImageForCrop(event.target.result);
        };
        reader.readAsDataURL(newFiles[newIndex]);
      }
    } else if (index < currentCropIndex) {
      // 삭제된 이미지가 현재보다 앞이면 인덱스 조정
      setCurrentCropIndex(prev => prev - 1);
    }
  }, [originalFilesForCrop, croppedImages, currentCropIndex]);

  // 모든 이미지 크롭 완료 후 저장
  const handleCropCompleteAll = useCallback(() => {
    if (!cropperRef.current) return;

    // 현재 크롭 중인 이미지 저장
    const canvas = cropperRef.current.getCanvas();
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;

      // 현재 이미지를 크롭된 리스트에 저장
      const currentBase64 = canvas.toDataURL('image/jpeg', 0.9);
      const finalCroppedImages = [...croppedImages];
      finalCroppedImages[currentCropIndex] = currentBase64;

      // 모든 크롭된 이미지를 File 객체로 변환하여 업로드
      const croppedFiles = finalCroppedImages
        .filter(base64 => base64 !== null)
        .map((base64, idx) => {
          // Base64를 Blob으로 변환
          const byteString = atob(base64.split(',')[1]);
          const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          return new File([blob], `cropped-image-${idx}.jpg`, { type: 'image/jpeg' });
        });

      if (croppedFiles.length > 0) {
        handleFiles(croppedFiles);
      }

      // 상태 초기화
      setCropModalOpen(false);
      setSelectedImageForCrop(null);
      setPendingFiles([]);
      setCroppedImages([]);
      setCurrentCropIndex(0);
      setOriginalFilesForCrop([]);
    }, 'image/jpeg', 0.9);
  }, [croppedImages, currentCropIndex, handleFiles]);

  // 크롭 완료 핸들러 (단일 모드 또는 다중 모드 완료)
  const handleCropComplete = useCallback(() => {
    if (!cropperRef.current) return;

    // 다중 업로드 모드인 경우
    if (multiple && originalFilesForCrop.length > 1) {
      handleCropCompleteAll();
      return;
    }

    // 단일 업로드 모드: 기존 로직
    const canvas = cropperRef.current.getCanvas();
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;

      const croppedFile = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
      handleFiles([croppedFile]);

      // 다음 파일 처리 (단일 모드에서 여러 파일 선택한 경우)
      const remainingFiles = pendingFiles.slice(1);
      if (remainingFiles.length > 0) {
        setPendingFiles(remainingFiles);
        const reader = new FileReader();
        reader.onload = (event) => {
          setSelectedImageForCrop(event.target.result);
        };
        reader.readAsDataURL(remainingFiles[0]);
      } else {
        setCropModalOpen(false);
        setSelectedImageForCrop(null);
        setPendingFiles([]);
      }
    }, 'image/jpeg', 0.9);
  }, [handleFiles, pendingFiles, multiple, originalFilesForCrop.length, handleCropCompleteAll]);

  // 크롭 취소 핸들러
  const handleCropCancel = useCallback(() => {
    setCropModalOpen(false);
    setSelectedImageForCrop(null);
    setPendingFiles([]);
    setCroppedImages([]);
    setCurrentCropIndex(0);
    setOriginalFilesForCrop([]);
  }, []);

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 이미지 클릭 시 Lightbox 열기
  const handleImageClick = useCallback((index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  // Lightbox용 이미지 슬라이드 생성
  const lightboxSlides = images.map((img) => ({
    src: img.base64 || img.url,
    alt: img.alt || '이미지'
  }));

  // 드래그 앤 드롭 종료
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = images.findIndex((img) => (img.cloudflareId || img.base64 || `img-${images.indexOf(img)}`) === active.id);
    const newIndex = images.findIndex((img) => (img.cloudflareId || img.base64 || `img-${images.indexOf(img)}`) === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      moveImage(oldIndex, newIndex);
    }
  };

  // 단일 이미지 모드 렌더링
  if (!multiple && images.length > 0) {
    const image = images[0];
    return (
      <div className={`space-y-4 ${className}`}>
        {/* 1:1 비율 고정 크기 미리보기 (160x160px) */}
        <div
          className="relative group w-40 h-40 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600"
        >
          <img
            src={image.base64 || image.url}
            alt={image.alt || '이미지'}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => handleImageClick(0)}
          />

          {/* 변경/삭제 버튼 */}
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            {/* 확대 보기 */}
            <button
              type="button"
              onClick={() => handleImageClick(0)}
              className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              aria-label={t('menu.imageUploader.viewImage')}
              title={t('menu.imageUploader.viewImage')}
            >
              <MagnifyingGlassPlusIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={openFileDialog}
              disabled={disabled || uploading}
              className="px-3 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('menu.imageUploader.changeImage')}
            </button>
            <button
              type="button"
              onClick={() => removeImage(0)}
              disabled={disabled || uploading}
              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('menu.imageUploader.removeImage')}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* 업로드 진행 상태 */}
          {uploading && uploadProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-2 rounded-b-lg">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-vietnam-mint h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-white text-xs mt-1 text-center">
                {t('menu.imageUploader.uploading', { progress: uploadProgress })}
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelectWithCrop}
          className="hidden"
          disabled={disabled || uploading}
        />

        {/* Lightbox 이미지 뷰어 (단일 모드) */}
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={lightboxSlides}
          plugins={[Zoom]}
          zoom={{
            maxZoomPixelRatio: 3,
            scrollToZoom: true
          }}
          carousel={{
            finite: true
          }}
          styles={{
            container: { backgroundColor: 'rgba(0, 0, 0, 0.9)' }
          }}
        />

        {/* 크롭 모달 (단일 이미지 모드) */}
        {enableCrop && (
          <EnhancedModal
            isOpen={cropModalOpen && !!selectedImageForCrop}
            onClose={handleCropCancel}
            title={t('menu:imageUploader.cropImage') || '이미지 크롭'}
            size="xl"
            variant="vietnamese"
            closeOnBackdrop={false}
            footer={
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleCropCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t('common:cancel') || '취소'}
                </button>
                <button
                  onClick={handleCropComplete}
                  className="px-4 py-2 bg-vietnam-mint text-white rounded-lg hover:bg-vietnam-mint/90 transition-colors flex items-center gap-2"
                >
                  <CheckIcon className="w-4 h-4" />
                  {t('menu:imageUploader.applyCrop') || '적용'}
                </button>
              </div>
            }
          >
            {/* 크롭 영역 */}
            <div className="relative w-full h-[400px]">
              <Cropper
                ref={cropperRef}
                src={selectedImageForCrop}
                className="cropper w-full h-full"
                stencilProps={{
                  aspectRatio: aspectRatio,
                  movable: true,
                  resizable: true,
                  handlers: {
                    eastNorth: true,
                    north: false,
                    westNorth: true,
                    west: false,
                    westSouth: true,
                    south: false,
                    eastSouth: true,
                    east: false
                  }
                }}
                defaultSize={({ imageSize }) => {
                  const minDimension = Math.min(imageSize.width, imageSize.height);
                  return {
                    width: minDimension,
                    height: minDimension / aspectRatio
                  };
                }}
                imageRestriction="stencil"
              />
            </div>

            {/* 안내 메시지 */}
            <div className="mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {t('menu:imageUploader.cropHint') || '이미지를 드래그하여 크롭 영역을 조절하세요. 모서리를 드래그하여 크기를 변경할 수 있습니다.'}
              </p>
            </div>
          </EnhancedModal>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 이미지 그리드 (다중 모드) */}
      {multiple && images.length > 0 && (
        <div className={`rounded-lg p-4 ${error ? 'border-2 border-red-500 bg-red-50 dark:bg-red-900/10' : ''}`}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img, idx) => img.cloudflareId || img.base64 || `img-${idx}`)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-visible">
                {images.map((image, index) => (
                  <SortableImageItem
                    key={`${image.cloudflareId || image.base64?.slice(0, 50) || 'img'}-${index}`}
                    image={image}
                    index={index}
                    onRemove={removeImage}
                    onSetPrimary={setPrimaryImage}
                    onMoveUp={() => moveImage(index, index - 1)}
                    onMoveDown={() => moveImage(index, index + 1)}
                    onImageClick={handleImageClick}
                    disabled={disabled}
                    uploading={uploading}
                    t={t}
                    totalImages={images.length}
                    showPrimary={showPrimary}
                    aspectRatio={aspectRatio}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 flex items-start gap-2 text-red-600 dark:text-red-400">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
        </div>
      )}

      {/* 업로드 영역 */}
      {(!multiple || images.length < maxFiles) && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDropWithCrop}
          className={`
            border-2 border-dashed rounded-lg p-${multiple && images.length > 0 ? '6' : '8'} text-center transition-all
            ${dragActive
              ? 'border-vietnam-mint bg-vietnam-mint/10 scale-105'
              : 'border-gray-300 dark:border-gray-600 hover:border-vietnam-mint'
            }
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileSelectWithCrop}
            className="hidden"
            disabled={disabled || uploading}
            multiple={multiple}
          />

          <div className="flex flex-col items-center justify-center">
            {uploading ? (
              <>
                <div className="animate-pulse">
                  <CloudArrowUpIcon className={`${multiple && images.length > 0 ? 'w-8 h-8' : 'w-12 h-12'} text-vietnam-mint mb-2`} />
                </div>
                <p className={`text-gray-700 dark:text-gray-300 ${multiple && images.length > 0 ? 'text-xs' : 'text-sm mb-2'}`}>
                  {t('menu.imageUploader.uploadingStatus')}
                </p>
                {uploadProgress > 0 && !multiple && (
                  <div className="w-full max-w-xs">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-vietnam-mint h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {uploadProgress}%
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <PhotoIcon className={`${multiple && images.length > 0 ? 'w-8 h-8' : 'w-12 h-12'} text-gray-400 mb-2`} />
                <p className={`text-gray-700 dark:text-gray-300 ${multiple && images.length > 0 ? 'text-xs font-medium' : 'text-sm mb-2'}`}>
                  {dragActive
                    ? t('menu.imageUploader.dropImage')
                    : multiple
                      ? t('menu.multiImageUploader.uploadPrompt')
                      : t('menu.imageUploader.uploadPrompt')
                  }
                </p>
                {multiple ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('menu.multiImageUploader.fileCount', { current: images.length, max: maxFiles })}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('menu.imageUploader.formatHint', { size: maxFileSize / 1024 / 1024 })}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      {images.length === 0 && !uploading && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• {t('menu.imageUploader.hint1')}</p>
          <p>• {t('menu.imageUploader.hint2')}</p>
          <p>• {multiple ? t('menu.multiImageUploader.hint3') : t('menu.imageUploader.hint3')}</p>
        </div>
      )}

      {/* Lightbox 이미지 뷰어 (다중 모드) */}
      {images.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={lightboxSlides}
          plugins={[Zoom]}
          zoom={{
            maxZoomPixelRatio: 3,
            scrollToZoom: true
          }}
          carousel={{
            finite: images.length === 1
          }}
          styles={{
            container: { backgroundColor: 'rgba(0, 0, 0, 0.9)' }
          }}
        />
      )}

      {/* 크롭 모달 */}
      {enableCrop && (
        <EnhancedModal
          isOpen={cropModalOpen && !!selectedImageForCrop}
          onClose={handleCropCancel}
          title={
            multiple && originalFilesForCrop.length > 1
              ? `${t('menu:imageUploader.cropImage') || '이미지 크롭'} (${currentCropIndex + 1}/${originalFilesForCrop.length})`
              : t('menu:imageUploader.cropImage') || '이미지 크롭'
          }
          size="xl"
          variant="vietnamese"
          closeOnBackdrop={false}
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500">
                {multiple && originalFilesForCrop.length > 1 ? (
                  <span>
                    {t('menu:imageUploader.croppedCount', {
                      cropped: croppedImages.filter(img => img !== null).length,
                      total: originalFilesForCrop.length
                    }) || `${croppedImages.filter(img => img !== null).length}/${originalFilesForCrop.length}개 크롭 완료`}
                  </span>
                ) : pendingFiles.length > 1 ? (
                  <span>
                    {t('menu:imageUploader.cropProgress', { total: pendingFiles.length }) || `처리 중: ${pendingFiles.length}개 남음`}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCropCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t('common:cancel') || '취소'}
                </button>
                {multiple && originalFilesForCrop.length > 1 && (
                  <button
                    onClick={handleSaveCurrentCrop}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {t('menu:imageUploader.saveAndNext') || '저장 & 다음'}
                  </button>
                )}
                <button
                  onClick={handleCropComplete}
                  className="px-4 py-2 bg-vietnam-mint text-white rounded-lg hover:bg-vietnam-mint/90 transition-colors flex items-center gap-2"
                >
                  <CheckIcon className="w-4 h-4" />
                  {multiple && originalFilesForCrop.length > 1
                    ? (t('menu:imageUploader.completeAll') || '모두 완료')
                    : (t('menu:imageUploader.applyCrop') || '적용')
                  }
                </button>
              </div>
            </div>
          }
        >
          {/* 크롭 영역 */}
          <div className="relative w-full h-[400px]">
            {/* 원본 복원 버튼 */}
            {croppedImages[currentCropIndex] && (
              <button
                onClick={handleResetToOriginal}
                className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 rounded-lg shadow-md hover:bg-white dark:hover:bg-gray-700 transition-all text-sm font-medium border border-gray-200 dark:border-gray-600"
                title={t('menu:imageUploader.resetToOriginal') || '원본으로 되돌리기'}
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>{t('menu:imageUploader.resetToOriginal') || '원본 복원'}</span>
              </button>
            )}
            <Cropper
              ref={cropperRef}
              src={selectedImageForCrop}
              className="cropper w-full h-full"
              stencilProps={{
                aspectRatio: aspectRatio,
                movable: true,
                resizable: true,
                handlers: {
                  eastNorth: true,
                  north: false,
                  westNorth: true,
                  west: false,
                  westSouth: true,
                  south: false,
                  eastSouth: true,
                  east: false
                }
              }}
              defaultSize={({ imageSize }) => {
                const minDimension = Math.min(imageSize.width, imageSize.height);
                return {
                  width: minDimension,
                  height: minDimension / aspectRatio
                };
              }}
              imageRestriction="stencil"
            />
          </div>

          {/* 다중 이미지 모드: 이미지 리스트 */}
          {multiple && originalFilesForCrop.length > 1 && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('menu:imageUploader.imageList') || '이미지 목록'} ({originalFilesForCrop.length})
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('menu:imageUploader.clickToEdit') || '클릭하여 수정'}
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {originalFilesForCrop.map((file, index) => {
                  const isCropped = croppedImages[index] !== null;
                  const isCurrentIndex = index === currentCropIndex;

                  return (
                    <div
                      key={`crop-thumb-${index}`}
                      className="relative flex-shrink-0 group"
                    >
                      {/* 썸네일 컨테이너 - aspectRatio에 맞게 동적 크기 적용 */}
                      <div
                        onClick={() => handleSelectImageForEdit(index)}
                        className={`
                          relative rounded-lg overflow-hidden cursor-pointer
                          border-2 transition-all
                          ${isCurrentIndex
                            ? 'border-vietnam-mint ring-2 ring-vietnam-mint/30'
                            : isCropped
                              ? 'border-green-500'
                              : 'border-gray-300 dark:border-gray-600 hover:border-vietnam-mint/50'
                          }
                        `}
                        style={{
                          width: aspectRatio >= 1 ? '80px' : `${80 * aspectRatio}px`,
                          height: aspectRatio >= 1 ? `${80 / aspectRatio}px` : '80px'
                        }}
                      >
                        {/* 썸네일 이미지 - 크롭된 이미지 또는 원본 */}
                        {croppedImages[index] ? (
                          <img
                            src={croppedImages[index]}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageThumbnail file={file} />
                        )}

                        {/* 순서 번호 */}
                        <div className="absolute top-1 left-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>

                        {/* 크롭 완료 표시 - 마스크 배경 */}
                        {isCropped && !isCurrentIndex && (
                          <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                            <CheckIcon className="w-8 h-8 text-white drop-shadow-md" />
                          </div>
                        )}

                        {/* 현재 편집 중 표시 */}
                        {isCurrentIndex && (
                          <div className="absolute bottom-0 left-0 right-0 bg-vietnam-mint text-white text-xs text-center py-1 font-medium">
                            {t('menu:imageUploader.editing') || '편집중'}
                          </div>
                        )}
                      </div>

                      {/* 삭제 버튼 - 마스크 배경 위에 표시, hover 시 나타남 */}
                      {originalFilesForCrop.length > 1 && (
                        <button
                          onClick={(e) => handleRemoveFromCropList(index, e)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          title={t('common:delete') || '삭제'}
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {t('menu:imageUploader.cropHint') || '이미지를 드래그하여 크롭 영역을 조절하세요. 모서리를 드래그하여 크기를 변경할 수 있습니다.'}
            </p>
          </div>
        </EnhancedModal>
      )}
    </div>
  );
};

export default UnifiedImageUploader;
