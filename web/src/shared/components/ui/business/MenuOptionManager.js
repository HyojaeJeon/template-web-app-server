'use client';
import { useState, useCallback } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  PhotoIcon,
  MagnifyingGlassPlusIcon
} from '@heroicons/react/24/outline';
import { Flame } from 'lucide-react';
import { FormField } from '@/shared/components/ui/forms';
import { useTranslation } from '@/shared/i18n';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { useToast } from '@/shared/providers/ToastProvider';
import ConditionalOptionBuilder from '@/shared/components/ui/business/ConditionalOptionBuilder';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

// 이미지 크롭
import { Cropper } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import EnhancedModal from '@/shared/components/ui/modals/EnhancedModal';
import { useRef } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

// SELECTION_TYPES moved to render time to access t() function

export default function MenuOptionManager({
  optionGroups = [],
  onChange,
  showTranslations = false,
  className = '',
  validationErrors = null,
  getFieldError = null
}) {
  const { t, language } = useTranslation();
  const { confirm, ConfirmDialog } = useConfirm();
  const { showError } = useToast();
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const cropperRef = useRef(null);

  // 최대 파일 크기 (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Lightbox 상태
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // 크롭 모달 상태
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState(null);
  const [cropTargetGroupId, setCropTargetGroupId] = useState(null);
  const [cropTargetOptionId, setCropTargetOptionId] = useState(null);

  // 이미지 확대 보기
  const handleImageClick = useCallback((imageUrl) => {
    setLightboxImage(imageUrl);
    setLightboxOpen(true);
  }, []);

  // 파일 선택 시 크롭 모달 열기
  const handleFileSelectForCrop = useCallback((e, groupId, optionId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCropTargetGroupId(groupId);
    setCropTargetOptionId(optionId);

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImageForCrop(event.target.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // input 초기화
    e.target.value = '';
  }, []);

  // 크롭 완료 핸들러
  const handleCropComplete = useCallback(() => {
    if (!cropperRef.current || !cropTargetGroupId || !cropTargetOptionId) return;

    const canvas = cropperRef.current.getCanvas();
    if (!canvas) return;

    // Canvas를 Blob으로 변환하여 용량 검사 후 Base64 변환
    canvas.toBlob((blob) => {
      if (!blob) {
        showError(t('menu.imageUploader.uploadError') || '이미지 처리에 실패했습니다.');
        return;
      }

      // ✅ 크롭 후 용량 검사 (10MB 제한)
      if (blob.size > MAX_FILE_SIZE) {
        const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
        const maxSizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
        showError(t('menu.imageUploader.compressedFileTooLarge', {
          size: sizeMB,
          maxSize: maxSizeMB
        }) || `이미지 크기(${sizeMB}MB)가 최대 허용 크기(${maxSizeMB}MB)를 초과합니다.`);
        return;
      }

      // Blob을 Base64로 변환
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;

        // 옵션 이미지 업데이트
        const updatedGroups = optionGroups.map(g => {
          if (g.id === cropTargetGroupId) {
            return {
              ...g,
              options: g.options.map(opt =>
                opt.id === cropTargetOptionId
                  ? {
                      ...opt,
                      images: [{ base64, isPrimary: true }],
                      imageUrl: base64
                    }
                  : opt
              )
            };
          }
          return g;
        });

        onChange(updatedGroups);

        // 크롭 모달 닫기
        setCropModalOpen(false);
        setSelectedImageForCrop(null);
        setCropTargetGroupId(null);
        setCropTargetOptionId(null);
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.9);
  }, [optionGroups, onChange, cropTargetGroupId, cropTargetOptionId, showError, t, MAX_FILE_SIZE]);

  // 크롭 취소 핸들러
  const handleCropCancel = useCallback(() => {
    setCropModalOpen(false);
    setSelectedImageForCrop(null);
    setCropTargetGroupId(null);
    setCropTargetOptionId(null);
  }, []);

  // 필드 에러 가져오기 헬퍼 함수
  const getError = (fieldName) => {
    if (!getFieldError) return null;
    return getFieldError(fieldName);
  };

  // Selection types with translations
  const SELECTION_TYPES = {
    SINGLE: { value: 'SINGLE', label: t('menu:add.options.singleSelect'), description: t('menu:add.options.singleSelectDesc') },
    MULTIPLE: { value: 'MULTIPLE', label: t('menu:add.options.multipleSelect'), description: t('menu:add.options.multipleSelectDesc') }
  };

  // ID 생성 함수
  const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 현재 언어에 맞는 필드값 반환 함수
  const getLocalizedField = (obj, fieldBaseName) => {
    if (!obj) return '';

    if (language === 'ko') {
      return obj[`${fieldBaseName}Ko`] || obj[fieldBaseName] || obj[`${fieldBaseName}En`] || '';
    } else if (language === 'en') {
      return obj[`${fieldBaseName}En`] || obj[fieldBaseName] || obj[`${fieldBaseName}Ko`] || '';
    } else {
      return obj[fieldBaseName] || obj[`${fieldBaseName}Ko`] || obj[`${fieldBaseName}En`] || '';
    }
  };

  // 옵션 추가
  const addOptionGroup = useCallback(() => {
    const newGroup = {
      id: generateId(),
      name: '',
      nameEn: '',
      nameKo: '',
      description: '',
      descriptionEn: '',
      descriptionKo: '',
      isRequired: false,
      minSelect: 0,
      maxSelect: 1,
      selectionType: 'SINGLE',
      displayOrder: optionGroups.length,
      options: []
    };
    
    const updatedGroups = [...optionGroups, newGroup];
    setExpandedGroups(prev => new Set([...prev, newGroup.id])); // 새 옵션은 자동 확장
    onChange(updatedGroups);
  }, [optionGroups, onChange]);

  // 매운맛 옵션 그룹 추가
  const addSpicyOptionGroup = useCallback(() => {
    const spicyGroup = {
      id: generateId(),
      isSpicyPreset: true, // 매운맛 프리셋 플래그 (서버 전송 시 제외됨)
      nameKo: '매운맛 단계',
      name: 'Mức độ cay',
      nameEn: 'Spicy Level',
      descriptionKo: '원하시는 매운맛 단계를 선택해주세요',
      description: 'Vui lòng chọn mức độ cay bạn muốn',
      descriptionEn: 'Please select your preferred spicy level',
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      selectionType: 'SINGLE',
      displayOrder: optionGroups.length,
      options: [
        {
          id: generateId(),
          nameKo: '안맵게',
          name: 'Không cay',
          nameEn: 'Mild',
          descriptionKo: '맵지 않게',
          description: 'Không cay',
          descriptionEn: 'Not spicy',
          price: 0,
          isAvailable: true,
          displayOrder: 0,
          images: [],
          imageUrl: ''
        },
        {
          id: generateId(),
          nameKo: '보통맵게',
          name: 'Cay vừa',
          nameEn: 'Medium',
          descriptionKo: '적당한 매운맛',
          description: 'Mức độ cay vừa phải',
          descriptionEn: 'Medium spicy',
          price: 0,
          isAvailable: true,
          displayOrder: 1,
          images: [],
          imageUrl: ''
        },
        {
          id: generateId(),
          nameKo: '맵게',
          name: 'Cay',
          nameEn: 'Spicy',
          descriptionKo: '매운맛',
          description: 'Mức độ cay',
          descriptionEn: 'Spicy',
          price: 0,
          isAvailable: true,
          displayOrder: 2,
          images: [],
          imageUrl: ''
        },
        {
          id: generateId(),
          nameKo: '아주맵게',
          name: 'Rất cay',
          nameEn: 'Extra Spicy',
          descriptionKo: '아주 매운맛',
          description: 'Rất cay',
          descriptionEn: 'Very spicy',
          price: 0,
          isAvailable: true,
          displayOrder: 3,
          images: [],
          imageUrl: ''
        }
      ]
    };

    const updatedGroups = [...optionGroups, spicyGroup];
    setExpandedGroups(prev => new Set([...prev, spicyGroup.id])); // 새 옵션은 자동 확장
    onChange(updatedGroups);
  }, [optionGroups, onChange]);

  // 옵션 제거
  const removeOptionGroup = useCallback((groupId) => {
    const updatedGroups = optionGroups.filter(group => group.id !== groupId);
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      newSet.delete(groupId);
      return newSet;
    });
    onChange(updatedGroups);
  }, [optionGroups, onChange]);

  // 옵션 업데이트
  const updateOptionGroup = useCallback((groupId, field, value) => {
    const updatedGroups = optionGroups.map(group => {
      if (group.id === groupId) {
        // 매운맛 프리셋 그룹은 선택 타입 변경 차단 (항상 SINGLE 유지)
        if (group.isSpicyPreset && field === 'selectionType') {
          return group; // 변경하지 않고 그대로 반환
        }

        let updatedGroup = { ...group, [field]: value };

        // 선택 타입이 변경되면 maxSelect 조정
        if (field === 'selectionType') {
          if (value === 'SINGLE') {
            updatedGroup.maxSelect = 1;
            updatedGroup.minSelect = Math.min(updatedGroup.minSelect, 1);
          }
        }

        // minSelect가 maxSelect보다 큰 경우 조정
        if (field === 'minSelect' && value > updatedGroup.maxSelect) {
          updatedGroup.maxSelect = value;
        }

        // maxSelect가 minSelect보다 작은 경우 조정
        if (field === 'maxSelect' && value < updatedGroup.minSelect) {
          updatedGroup.minSelect = value;
        }

        return updatedGroup;
      }
      return group;
    });
    onChange(updatedGroups);
  }, [optionGroups, onChange]);

  // 옵션 순서 변경
  const moveOptionGroup = useCallback((groupId, direction) => {
    const currentIndex = optionGroups.findIndex(group => group.id === groupId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= optionGroups.length) return;
    
    const updatedGroups = [...optionGroups];
    [updatedGroups[currentIndex], updatedGroups[newIndex]] = [updatedGroups[newIndex], updatedGroups[currentIndex]];
    
    // displayOrder 업데이트
    updatedGroups.forEach((group, index) => {
      group.displayOrder = index;
    });
    
    onChange(updatedGroups);
  }, [optionGroups, onChange]);

  // 항목 추가
  const addOption = useCallback((groupId) => {
    const updatedGroups = optionGroups.map(group => {
      if (group.id === groupId) {
        const newOption = {
          id: generateId(),
          name: '',
          nameEn: '',
          nameKo: '',
          description: '',
          descriptionEn: '',
          descriptionKo: '',
          price: 0,
          imageUrl: '',
          images: [],
          isAvailable: true,
          displayOrder: group.options.length
        };

        return {
          ...group,
          options: [...group.options, newOption]
        };
      }
      return group;
    });
    onChange(updatedGroups);
  }, [optionGroups, onChange]);

  // 항목 제거
  const removeOption = useCallback((groupId, optionId) => {
    const updatedGroups = optionGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          options: group.options.filter(option => option.id !== optionId)
        };
      }
      return group;
    });
    onChange(updatedGroups);
  }, [optionGroups, onChange]);

  // 항목 업데이트
  const updateOption = useCallback((groupId, optionId, field, value) => {
    const updatedGroups = optionGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          options: group.options.map(option => 
            option.id === optionId ? { ...option, [field]: value } : option
          )
        };
      }
      return group;
    });
    onChange(updatedGroups);
  }, [optionGroups, onChange]);

  // 항목 순서 변경
  const moveOption = useCallback((groupId, optionId, direction) => {
    const updatedGroups = optionGroups.map(group => {
      if (group.id === groupId) {
        const currentIndex = group.options.findIndex(option => option.id === optionId);
        if (currentIndex === -1) return group;
        
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= group.options.length) return group;
        
        const updatedOptions = [...group.options];
        [updatedOptions[currentIndex], updatedOptions[newIndex]] = [updatedOptions[newIndex], updatedOptions[currentIndex]];

        // displayOrder 업데이트 (읽기 전용 객체이므로 새 객체 생성)
        const optionsWithUpdatedOrder = updatedOptions.map((option, index) => ({
          ...option,
          displayOrder: index
        }));

        return { ...group, options: optionsWithUpdatedOrder };
      }
      return group;
    });
    onChange(updatedGroups);
  }, [optionGroups, onChange]);

  // 옵션 확장/축소 토글
  const toggleGroupExpansion = useCallback((groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('menu:add.options.manageOptionsCount', { count: optionGroups.length })}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('menu:add.options.configureOptions')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 매운맛 옵션이 이미 적용되어 있으면 버튼 비활성화 */}
          {(() => {
            const hasSpicyPreset = optionGroups.some(group => group.isSpicyPreset === true);
            return (
              <button
                onClick={addSpicyOptionGroup}
                disabled={hasSpicyPreset}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  hasSpicyPreset
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                    : 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400'
                }`}
                title={hasSpicyPreset ? t('menu:add.options.spicyAlreadyApplied') : undefined}
              >
                <Flame className="w-4 h-4" />
                {t('menu:add.options.addSpicyOptions')}
              </button>
            );
          })()}
          <button
            onClick={addOptionGroup}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            {t('menu:add.options.addOption')}
          </button>
        </div>
      </div>

      {/* 옵션 그룹 목록 */}
      {optionGroups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Cog6ToothIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('menu:add.options.noOptions')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('menu:add.options.configureOptions')}
          </p>
          <button
            onClick={addOptionGroup}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            {t('menu:add.options.createFirstOption')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {optionGroups.map((group, groupIndex) => {
            const isExpanded = expandedGroups.has(group.id);
            
            return (
              <div
                key={group.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* 그룹 헤더 */}
                <div
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => toggleGroupExpansion(group.id)}
                  >
                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {groupIndex + 1}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {getLocalizedField(group, 'name') || t('menu:add.options.unnamed')}
                      </h5>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{SELECTION_TYPES[group.selectionType]?.label}</span>
                        <span>{group.options.length}{t('menu:add.options.optionCount')}</span>
                        {group.isRequired && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            {t('menu:add.options.requiredBadge')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 선택 타입 토글 버튼 - 기본값 SINGLE */}
                    {/* 매운맛 프리셋은 단일 선택만 허용 (토글 비활성화) */}
                    <div className={`flex rounded-lg border overflow-hidden mr-2 ${
                      group.isSpicyPreset
                        ? 'border-gray-200 dark:border-gray-700 opacity-60'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!group.isSpicyPreset) {
                            updateOptionGroup(group.id, 'selectionType', 'SINGLE');
                          }
                        }}
                        disabled={group.isSpicyPreset}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          !group.selectionType || group.selectionType === 'SINGLE'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        } ${group.isSpicyPreset ? 'cursor-not-allowed' : ''}`}
                        title={group.isSpicyPreset ? t('menu:add.options.spicySingleSelectOnly') : SELECTION_TYPES.SINGLE.description}
                      >
                        {t('menu:add.options.singleSelect')}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!group.isSpicyPreset) {
                            updateOptionGroup(group.id, 'selectionType', 'MULTIPLE');
                          }
                        }}
                        disabled={group.isSpicyPreset}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          group.selectionType === 'MULTIPLE'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        } ${group.isSpicyPreset ? 'cursor-not-allowed' : ''}`}
                        title={group.isSpicyPreset ? t('menu:add.options.spicySingleSelectOnly') : SELECTION_TYPES.MULTIPLE.description}
                      >
                        {t('menu:add.options.multipleSelect')}
                      </button>
                    </div>
                    {/* 순서 변경 버튼 */}
                    {groupIndex > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveOptionGroup(group.id, 'up');
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        title={t('menu:add.options.moveUp')}
                      >
                        <ArrowUpIcon className="w-4 h-4" />
                      </button>
                    )}

                    {groupIndex < optionGroups.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveOptionGroup(group.id, 'down');
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        title={t('menu:add.options.moveDown')}
                      >
                        <ArrowDownIcon className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* 삭제 버튼 */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmed = await confirm({
                          title: t('menu:add.options.confirmDeleteGroup'),
                          message: t('menu:add.options.confirmDeleteGroupMessage'),
                          confirmText: t('common:delete'),
                          cancelText: t('common:cancel'),
                          variant: 'danger'
                        });
                        if (confirmed) {
                          removeOptionGroup(group.id);
                        }
                      }}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title={t('common:delete')}
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                    
                    {/* 확장/축소 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroupExpansion(group.id);
                      }}
                      className={`p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-all transform ${isExpanded ? 'rotate-180' : ''}`}
                      title={isExpanded ? t('common:actions.collapse') : t('common:actions.expand')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 그룹 상세 설정 */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50">
                    <div className="space-y-6">
                      {/* 조건부 표시 설정 - 최상단으로 이동 */}
                      <ConditionalOptionBuilder
                        optionGroups={optionGroups}
                        currentGroup={group}
                        conditionalDisplay={group.conditionalDisplay}
                        onChange={(newConditional) =>
                          updateOptionGroup(group.id, 'conditionalDisplay', newConditional)
                        }
                      />

                      {/* 옵션 그룹명 - 인라인 형태 */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                          {t('menu:add.options.optionNameRequired')}
                        </label>

                        {/* 한국어 */}
                        <div className="space-y-1">
                          <label className={`text-xs font-medium ${showTranslations ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            🇰🇷 한국어
                          </label>
                          <div>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={group.nameKo || ''}
                                onChange={(e) => updateOptionGroup(group.id, 'nameKo', e.target.value)}
                                placeholder="항목명 예: 사이즈 선택"
                                className={`flex-1 px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 ${
                                  getError(`optionGroup_${groupIndex}_name`)
                                    ? 'border-2 border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500'
                                    : showTranslations
                                      ? 'border-2 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 focus:ring-blue-500 focus:border-blue-500'
                                      : 'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-transparent'
                                }`}
                              />
                              <span className="text-xs text-gray-400">-</span>
                              <input
                                type="text"
                                value={group.descriptionKo || ''}
                                onChange={(e) => updateOptionGroup(group.id, 'descriptionKo', e.target.value)}
                                placeholder="설명 예: 원하는 사이즈를 선택해주세요"
                                className={`flex-1 px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 ${
                                  showTranslations
                                    ? 'border-2 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 focus:ring-blue-500 focus:border-blue-500'
                                    : 'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-transparent'
                                }`}
                              />
                            </div>
                            {getError(`optionGroup_${groupIndex}_name`) && (
                              <div className="flex items-center gap-2 mt-1 text-sm text-red-600 dark:text-red-400">
                                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                                <span>{getError(`optionGroup_${groupIndex}_name`)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {showTranslations && (
                          <>
                            {/* Local어 */}
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-green-700 dark:text-green-400">🇻🇳 Tiếng Việt</label>
                              <div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={group.name || ''}
                                    onChange={(e) => updateOptionGroup(group.id, 'name', e.target.value)}
                                    placeholder="Tên mục VD: Chọn kích cỡ"
                                    className={`flex-1 px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 text-green-900 dark:text-green-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 ${
                                      getError(`optionGroup_${groupIndex}_name`)
                                        ? 'border-2 border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500'
                                        : 'border-2 border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500'
                                    }`}
                                  />
                                  <span className="text-xs text-gray-400">-</span>
                                  <input
                                    type="text"
                                    value={group.description || ''}
                                    onChange={(e) => updateOptionGroup(group.id, 'description', e.target.value)}
                                    placeholder="Mô tả VD: Vui lòng chọn kích cỡ bạn muốn"
                                    className="flex-1 px-3 py-2 text-sm border-2 border-green-200 dark:border-green-800 rounded-lg bg-white dark:bg-gray-700 text-green-900 dark:text-green-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  />
                                </div>
                                {getError(`optionGroup_${groupIndex}_name`) && (
                                  <div className="flex items-center gap-2 mt-1 text-sm text-red-600 dark:text-red-400">
                                    <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                                    <span>{getError(`optionGroup_${groupIndex}_name`)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 영어 */}
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-purple-700 dark:text-purple-400">🇬🇧 English</label>
                              <div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={group.nameEn || ''}
                                    onChange={(e) => updateOptionGroup(group.id, 'nameEn', e.target.value)}
                                    placeholder="Item name eg: Size Selection"
                                    className={`flex-1 px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 text-purple-900 dark:text-purple-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 ${
                                      getError(`optionGroup_${groupIndex}_name`)
                                        ? 'border-2 border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500'
                                        : 'border-2 border-purple-200 dark:border-purple-800 focus:ring-purple-500 focus:border-purple-500'
                                    }`}
                                  />
                                  <span className="text-xs text-gray-400">-</span>
                                  <input
                                    type="text"
                                    value={group.descriptionEn || ''}
                                    onChange={(e) => updateOptionGroup(group.id, 'descriptionEn', e.target.value)}
                                    placeholder="Description eg: Please select your desired size"
                                    className="flex-1 px-3 py-2 text-sm border-2 border-purple-200 dark:border-purple-800 rounded-lg bg-white dark:bg-gray-700 text-purple-900 dark:text-purple-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  />
                                </div>
                                {getError(`optionGroup_${groupIndex}_name`) && (
                                  <div className="flex items-center gap-2 mt-1 text-sm text-red-600 dark:text-red-400">
                                    <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                                    <span>{getError(`optionGroup_${groupIndex}_name`)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

            

                      {/* 옵션 선택 설정 */}
                      <div className="space-y-4">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                          {t('menu:add.options.selectionSettingsRequired')}
                        </label>

                        {/* 필수/선택 라디오 박스 */}
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`required-${group.id}`}
                              checked={group.isRequired === true}
                              onChange={() => updateOptionGroup(group.id, 'isRequired', true)}
                              className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{t('menu:add.options.required')}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`required-${group.id}`}
                              checked={group.isRequired === false}
                              onChange={() => updateOptionGroup(group.id, 'isRequired', false)}
                              className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{t('menu:add.options.optional')}</span>
                          </label>
                          <QuestionMarkCircleIcon
                            className="w-4 h-4 text-gray-400"
                            title={t('menu:add.options.requiredTooltip')}
                          />
                        </div>

                        {/* 최대 선택 개수 제한 체크박스 + 입력 필드 */}
                        <div className="flex items-center gap-4 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              id={`maxSelections-enabled-${group.id}`}
                              checked={group.maxSelections !== null && group.maxSelections !== undefined}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // 체크하면 옵션 개수의 절반 또는 최소 1로 기본값 설정
                                  const defaultMax = Math.max(1, Math.floor(group.options.length / 2) || 1);
                                  updateOptionGroup(group.id, 'maxSelections', defaultMax);
                                } else {
                                  // 체크 해제하면 null로 설정 (제한 없음)
                                  updateOptionGroup(group.id, 'maxSelections', null);
                                }
                              }}
                              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {t('menu:add.options.limitMaxSelections')}
                            </span>
                          </label>

                          {/* 최대 개수 입력 필드 (체크 시 표시) */}
                          {group.maxSelections !== null && group.maxSelections !== undefined && (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max={group.options.length || 99}
                                value={group.maxSelections || 1}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1;
                                  // 최소 1, 최대 옵션 개수까지로 제한
                                  const maxLimit = group.options.length || 99;
                                  const clampedValue = Math.min(Math.max(1, value), maxLimit);
                                  updateOptionGroup(group.id, 'maxSelections', clampedValue);
                                }}
                                className="w-20 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
                              />
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {t('menu:add.options.maxSelectionsUnit', { total: group.options.length })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 도움말 텍스트 */}
                        {group.maxSelections !== null && group.maxSelections !== undefined && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                            {t('menu:add.options.maxSelectionsHelp', { max: group.maxSelections, total: group.options.length })}
                          </p>
                        )}
                      </div>

                      {/* 개별 옵션 항목 관리 */}
                      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <h6 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {t('menu:add.options.optionItemsCount', { count: group.options.length })}
                          </h6>
                          <button
                            onClick={() => addOption(group.id)}
                            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-all ${
                              group.options.length === 0 && getError(`optionGroup_${groupIndex}_options`)
                                ? 'bg-red-500 hover:bg-red-600 text-white border-2 border-red-600 animate-pulse shadow-lg shadow-red-500/50'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                          >
                            <PlusIcon className="w-4 h-4" />
                            {t('menu:add.options.addItem')}
                          </button>
                        </div>

                        {group.options.length === 0 ? (
                          <div className={`text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-dashed transition-all ${
                            getError(`optionGroup_${groupIndex}_options`)
                              ? 'border-red-500 dark:border-red-400 border-2 bg-red-50 dark:bg-red-900/10'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            <p className={`text-sm mb-3 ${
                              getError(`optionGroup_${groupIndex}_options`)
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {getError(`optionGroup_${groupIndex}_options`) || t('menu:add.options.noItems')}
                            </p>
                            <button
                              onClick={() => addOption(group.id)}
                              className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
                                getError(`optionGroup_${groupIndex}_options`)
                                  ? 'bg-red-500 hover:bg-red-600 text-white border-2 border-red-600 animate-pulse shadow-lg shadow-red-500/50'
                                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                              }`}
                            >
                              <PlusIcon className="w-4 h-4" />
                              {t('menu:add.options.addFirstItem')}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {group.options.map((option, optionIndex) => (
                              <div
                                key={option.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                              >
                                <div className="flex items-start gap-3">
                                  {/* 순서 번호 */}
                                  <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center text-xs font-medium">
                                    {optionIndex + 1}
                                  </div>

                                  {/* 이미지 영역 */}
                                  <div className="flex-shrink-0 relative group">
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      onChange={(e) => handleFileSelectForCrop(e, group.id, option.id)}
                                      className="hidden"
                                      id={`option-image-${group.id}-${option.id}`}
                                    />
                                    {/* ✅ overflow-hidden 제거하여 버튼이 잘리지 않도록 수정 */}
                                    <div className="relative w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                      {(option.images && option.images.length > 0) || option.imageUrl ? (
                                        <>
                                          <label
                                            htmlFor={`option-image-${group.id}-${option.id}`}
                                            className="w-full h-full flex items-center justify-center cursor-pointer overflow-hidden rounded-lg"
                                          >
                                            <img
                                              src={option.images?.[0]?.base64 || option.images?.[0]?.url || option.imageUrl}
                                              alt={option.nameKo || 'Option'}
                                              className="w-full h-full object-contain"
                                            />
                                          </label>
                                          {/* 이미지 확대 버튼 - 좌측 상단 */}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const imageUrl = option.images?.[0]?.base64 || option.images?.[0]?.url || option.imageUrl;
                                              handleImageClick(imageUrl);
                                            }}
                                            className="absolute -top-2 -left-2 z-20 w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            title={t('menu:imageUploader.viewImage')}
                                          >
                                            <MagnifyingGlassPlusIcon className="w-4 h-4" />
                                          </button>
                                          {/* 이미지 제거 버튼 - 우측 상단 고정 */}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              // ✅ 한 번에 두 필드 업데이트하여 상태 일관성 보장
                                              const updatedGroups = optionGroups.map(g => {
                                                if (g.id === group.id) {
                                                  return {
                                                    ...g,
                                                    options: g.options.map(opt =>
                                                      opt.id === option.id
                                                        ? { ...opt, images: [], imageUrl: '' }
                                                        : opt
                                                    )
                                                  };
                                                }
                                                return g;
                                              });
                                              onChange(updatedGroups);
                                            }}
                                            className="absolute -top-2 -right-2 z-20 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            title={t('menu:add.options.removeImage')}
                                          >
                                            <XMarkIcon className="w-4 h-4" />
                                          </button>
                                        </>
                                      ) : (
                                        <label
                                          htmlFor={`option-image-${group.id}-${option.id}`}
                                          className="w-full h-full flex items-center justify-center cursor-pointer"
                                        >
                                          <PhotoIcon className="w-8 h-8 text-gray-400" />
                                        </label>
                                      )}
                                    </div>
                                  </div>

                                  {/* 다국어 필드 - 스택 형태 */}
                                  <div className="flex-1 space-y-2">
                                    {/* 한국어 */}
                                    <div className="space-y-1">
                                      <label className={`text-xs font-medium ${showTranslations ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                        🇰🇷 한국어
                                      </label>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={option.nameKo || ''}
                                            onChange={(e) => updateOption(group.id, option.id, 'nameKo', e.target.value)}
                                            placeholder="옵션명 예: 스몰"
                                            className={`flex-1 px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 ${
                                              getError(`option_${groupIndex}_${optionIndex}_name`)
                                                ? 'border-2 border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500'
                                                : showTranslations
                                                  ? 'border-2 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 focus:ring-blue-500 focus:border-blue-500'
                                                  : 'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-transparent'
                                            }`}
                                          />
                                          <span className="text-xs text-gray-400">-</span>
                                          <input
                                            type="text"
                                            value={option.descriptionKo || ''}
                                            onChange={(e) => updateOption(group.id, option.id, 'descriptionKo', e.target.value)}
                                            placeholder="설명 예: 작은 사이즈"
                                            className={`flex-1 px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 ${
                                              showTranslations
                                                ? 'border-2 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 focus:ring-blue-500 focus:border-blue-500'
                                                : 'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-transparent'
                                            }`}
                                          />
                                        </div>
                                        {getError(`option_${groupIndex}_${optionIndex}_name`) && (
                                          <div className="flex items-center gap-2 mt-1 text-sm text-red-600 dark:text-red-400">
                                            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                                            <span>{getError(`option_${groupIndex}_${optionIndex}_name`)}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {showTranslations && (
                                      <>
                                        {/* Local어 */}
                                        <div className="space-y-1">
                                          <label className="text-xs font-medium text-green-700 dark:text-green-400">🇻🇳 Tiếng Việt</label>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="text"
                                                value={option.name || ''}
                                                onChange={(e) => updateOption(group.id, option.id, 'name', e.target.value)}
                                                placeholder="Tên tùy chọn VD: Nhỏ"
                                                className={`flex-1 px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 text-green-900 dark:text-green-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 ${
                                                  getError(`option_${groupIndex}_${optionIndex}_name`)
                                                    ? 'border-2 border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500'
                                                    : 'border-2 border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500'
                                                }`}
                                              />
                                              <span className="text-xs text-gray-400">-</span>
                                              <input
                                                type="text"
                                                value={option.description || ''}
                                                onChange={(e) => updateOption(group.id, option.id, 'description', e.target.value)}
                                                placeholder="Mô tả VD: Kích cỡ nhỏ"
                                                className="flex-1 px-3 py-2 text-sm border-2 border-green-200 dark:border-green-800 rounded-lg bg-white dark:bg-gray-700 text-green-900 dark:text-green-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                              />
                                            </div>
                                            {getError(`option_${groupIndex}_${optionIndex}_name`) && (
                                              <div className="flex items-center gap-2 mt-1 text-sm text-red-600 dark:text-red-400">
                                                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                                                <span>{getError(`option_${groupIndex}_${optionIndex}_name`)}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* 영어 */}
                                        <div className="space-y-1">
                                          <label className="text-xs font-medium text-purple-700 dark:text-purple-400">🇬🇧 English</label>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="text"
                                                value={option.nameEn || ''}
                                                onChange={(e) => updateOption(group.id, option.id, 'nameEn', e.target.value)}
                                                placeholder="Option name eg: Small"
                                                className={`flex-1 px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 text-purple-900 dark:text-purple-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 ${
                                                  getError(`option_${groupIndex}_${optionIndex}_name`)
                                                    ? 'border-2 border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500'
                                                    : 'border-2 border-purple-200 dark:border-purple-800 focus:ring-purple-500 focus:border-purple-500'
                                                }`}
                                              />
                                              <span className="text-xs text-gray-400">-</span>
                                              <input
                                                type="text"
                                                value={option.descriptionEn || ''}
                                                onChange={(e) => updateOption(group.id, option.id, 'descriptionEn', e.target.value)}
                                                placeholder="Description eg: Small size"
                                                className="flex-1 px-3 py-2 text-sm border-2 border-purple-200 dark:border-purple-800 rounded-lg bg-white dark:bg-gray-700 text-purple-900 dark:text-purple-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                              />
                                            </div>
                                            {getError(`option_${groupIndex}_${optionIndex}_name`) && (
                                              <div className="flex items-center gap-2 mt-1 text-sm text-red-600 dark:text-red-400">
                                                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                                                <span>{getError(`option_${groupIndex}_${optionIndex}_name`)}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </>
                                    )}

                                    {/* 추가 가격 및 가용성 */}
                                    <div className="flex items-center gap-3 pt-1">
                                      <div className="flex-1 max-w-[180px]">
                                        <FormField
                                          label={t('menu:add.options.additionalPrice')}
                                          type="number"
                                          value={option.price || 0}
                                          onChange={(e) => updateOption(group.id, option.id, 'price', parseInt(e.target.value.replace(/,/g, '')) || 0)}
                                          showThousandSeparator={true}
                                          placeholder="0"
                                          className="text-xs"
                                          inputClassName="py-2 text-xs"
                                        />
                                      </div>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={option.isAvailable !== false}
                                          onChange={(e) => updateOption(group.id, option.id, 'isAvailable', e.target.checked)}
                                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                        />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{t('menu:add.options.isAvailable')}</span>
                                      </label>
                                    </div>
                                  </div>

                                  {/* 버튼 그룹 */}
                                  <div className="flex-shrink-0 flex flex-col gap-1">
                                    {optionIndex > 0 && (
                                      <button
                                        onClick={() => moveOption(group.id, option.id, 'up')}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                        title={t('menu:add.options.moveUp')}
                                      >
                                        <ArrowUpIcon className="w-4 h-4" />
                                      </button>
                                    )}
                                    {optionIndex < group.options.length - 1 && (
                                      <button
                                        onClick={() => moveOption(group.id, option.id, 'down')}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                        title={t('menu:add.options.moveDown')}
                                      >
                                        <ArrowDownIcon className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={async () => {
                                        const confirmed = await confirm({
                                          title: t('menu:add.options.confirmDeleteOption'),
                                          message: t('menu:add.options.confirmDeleteOptionMessage'),
                                          confirmText: t('common:delete'),
                                          cancelText: t('common:cancel'),
                                          variant: 'danger'
                                        });
                                        if (confirmed) {
                                          removeOption(group.id, option.id);
                                        }
                                      }}
                                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                      title={t('common:delete')}
                                    >
                                      <XMarkIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>


                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 요약 정보 */}
      {optionGroups.length > 0 && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-800 dark:text-emerald-200">
              <p className="font-medium mb-1">{t('menu:add.options.configSummary')}:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>{t('menu:add.options.totalGroups', { count: optionGroups.length })}</li>
                <li>{t('menu:add.options.totalOptions', { count: optionGroups.reduce((sum, group) => sum + group.options.length, 0) })}</li>
                <li>{t('menu:add.options.requiredOptions', { count: optionGroups.filter(group => group.isRequired).length })}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 확인 모달 */}
      <ConfirmDialog />

      {/* 이미지 확대 Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxImage ? [{ src: lightboxImage }] : []}
        plugins={[Zoom]}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 2,
          doubleTapDelay: 300
        }}
        carousel={{
          finite: true
        }}
      />

      {/* 이미지 크롭 모달 */}
      <EnhancedModal
        isOpen={cropModalOpen && !!selectedImageForCrop}
        onClose={handleCropCancel}
        title={t('menu:imageUploader.cropImage') || '이미지 크롭'}
        size="xl"
      >
        <div className="space-y-4">
          {/* 안내 문구 */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('menu:imageUploader.cropHint') || '이미지를 드래그하여 크롭 영역을 조절하세요. 모서리를 드래그하여 크기를 변경할 수 있습니다.'}
          </p>

          {/* 크롭퍼 */}
          <div className="relative w-full h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {selectedImageForCrop && (
              <Cropper
                ref={cropperRef}
                src={selectedImageForCrop}
                className="w-full h-full"
                stencilProps={{
                  aspectRatio: 1,
                  movable: true,
                  resizable: true,
                  lines: true,
                  handlers: true
                }}
                defaultSize={({ imageSize }) => {
                  const minDimension = Math.min(imageSize.width, imageSize.height);
                  return {
                    width: minDimension,
                    height: minDimension
                  };
                }}
                imageRestriction="stencil"
              />
            )}
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleCropCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {t('common:cancel') || '취소'}
            </button>
            <button
              type="button"
              onClick={handleCropComplete}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <CheckIcon className="w-4 h-4" />
              {t('menu:imageUploader.applyCrop') || '적용'}
            </button>
          </div>
        </div>
      </EnhancedModal>
    </div>
  );
}