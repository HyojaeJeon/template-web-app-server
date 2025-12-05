/**
 * useImagePicker Hook
 * 이미지 선택/촬영을 위한 재사용 가능한 커스텀 훅
 * react-native-image-crop-picker 전용
 * CLAUDE.md 가이드라인 준수: DRY 원칙, 재사용성, WCAG 2.1
 */
import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import ImagePicker from 'react-native-image-crop-picker';
import { useTranslation } from 'react-i18next';

// 기본 이미지 선택 옵션
const DEFAULT_IMAGE_OPTIONS = {
  width: 800,
  height: 800,
  cropping: true,
  cropperCircleOverlay: false,
  compressImageMaxWidth: 800,
  compressImageMaxHeight: 800,
  compressImageQuality: 0.8,
  includeBase64: false,
  includeExif: true,
  mediaType: 'photo',
  multiple: false};

// 권한 요청 함수
const requestPermission = async (permission) => {
  try {
    const result = await request(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.warn('Permission request failed:', error);
    return false;
  }
};

// 권한 확인 함수
const checkPermission = async (permission) => {
  try {
    const result = await check(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.warn('Permission check failed:', error);
    return false;
  }
};

/**
 * useImagePicker Hook
 * @param {Object} options - 이미지 선택 옵션 (선택사항)
 * @returns {Object} 이미지 선택 관련 함수들
 */
export const useImagePicker = (options = {}) => {
  const { t } = useTranslation(['common']);
  const imageOptions = { ...DEFAULT_IMAGE_OPTIONS, ...options };

  // 갤러리에서 이미지 선택 (단일/다중 선택 지원)
  const openGallery = useCallback(async (customOptions = {}) => {
    try {
      // Android는 READ_EXTERNAL_STORAGE, iOS는 PHOTO_LIBRARY 권한 필요
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

      const hasPermission = await checkPermission(permission);

      if (!hasPermission) {
        const granted = await requestPermission(permission);
        if (!granted) {
          Alert.alert(
            t('common:imagePicker.permissions.photoLibraryTitle'),
            t('common:imagePicker.permissions.photoLibraryMessage'),
            [{ text: t('common:imagePicker.permissions.ok') }]
          );
          return { success: false, error: t('common:imagePicker.errors.permissionDenied') };
        }
      }

      // 커스텀 옵션과 기본 옵션 병합
      const pickerOptions = { ...imageOptions, ...customOptions };
      const result = await ImagePicker.openPicker(pickerOptions);

      // 다중 선택 처리
      if (pickerOptions.multiple && Array.isArray(result)) {
        const images = result.map((img) => ({
          uri: img.path,
          path: img.path,
          mime: img.mime,
          type: img.mime,
          filename: img.filename || `image_${Date.now()}.jpg`,
          size: img.size,
          width: img.width,
          height: img.height,
        }));

        return { success: true, images };
      }

      // 단일 선택 처리
      return {
        success: true,
        image: {
          uri: result.path,
          path: result.path,
          mime: result.mime,
          type: result.mime,
          filename: result.filename || `image_${Date.now()}.jpg`,
          size: result.size,
          width: result.width,
          height: result.height,
        },
      };
    } catch (error) {
      if (error.code === 'E_PICKER_CANCELLED') {
        return { success: false, cancelled: true };
      }

      console.error(t('common:imagePicker.logs.gallerySelectError') + ':', error);
      return {
        success: false,
        error: error.message || t('common:imagePicker.errors.gallerySelectFailed')
      };
    }
  }, [imageOptions, t]);

  // 카메라로 촬영
  const openCamera = useCallback(async () => {
    try {
      // 카메라 권한 확인 및 요청
      const cameraPermission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;

      const hasPermission = await checkPermission(cameraPermission);

      if (!hasPermission) {
        const granted = await requestPermission(cameraPermission);
        if (!granted) {
          Alert.alert(
            t('common:imagePicker.permissions.cameraTitle'),
            t('common:imagePicker.permissions.cameraMessage'),
            [{ text: t('common:imagePicker.permissions.ok') }]
          );
          return { success: false, error: t('common:imagePicker.errors.permissionDenied') };
        }
      }

      const image = await ImagePicker.openCamera(imageOptions);
      
      return {
        success: true,
        image: {
          uri: image.path,
          path: image.path,  // RNFS를 위한 경로
          mime: image.mime,  // MIME 타입 (일관성 유지)
          type: image.mime,  // 호환성을 위한 중복 필드
          name: image.filename || `camera_${Date.now()}.jpg`,
          size: image.size,
          width: image.width,
          height: image.height}};
    } catch (error) {
      if (error.code === 'E_PICKER_CANCELLED') {
        return { success: false, cancelled: true };
      }
      
      console.error(t('common:imagePicker.logs.cameraError') + ':', error);
      return {
        success: false,
        error: error.message || t('common:imagePicker.errors.cameraCaptureFailed')
      };
    }
  }, [imageOptions, t]);

  // 이미지 선택 옵션 다이얼로그 표시
  const showImagePickerOptions = useCallback(() => {
    Alert.alert(
      t('common:imagePicker.dialog.title'),
      t('common:imagePicker.dialog.message'),
      [
        {
          text: t('common:imagePicker.dialog.gallery'),
          onPress: openGallery},
        {
          text: t('common:imagePicker.dialog.camera'),
          onPress: openCamera},
        {
          text: t('common:imagePicker.dialog.cancel'),
          style: 'cancel'},
      ],
      { cancelable: true }
    );
  }, [openGallery, openCamera, t]);

  // 다중 이미지 선택 (갤러리만)
  const openMultipleGallery = useCallback(async (maxFiles = 5) => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.PHOTO_LIBRARY 
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

      const hasPermission = await checkPermission(permission);
      
      if (!hasPermission) {
        const granted = await requestPermission(permission);
        if (!granted) {
          Alert.alert(
            t('common:imagePicker.permissions.photoLibraryTitle'),
            t('common:imagePicker.permissions.photoLibraryMessage'),
            [{ text: t('common:imagePicker.permissions.ok') }]
          );
          return { success: false, error: t('common:imagePicker.errors.permissionDenied') };
        }
      }

      const images = await ImagePicker.openPicker({
        ...imageOptions,
        multiple: true,
        maxFiles,
        cropping: false, // 다중 선택 시 크롭 비활성화
      });
      
      return {
        success: true,
        images: images.map(image => ({
          uri: image.path,
          path: image.path,  // RNFS를 위한 경로
          mime: image.mime,  // MIME 타입 (일관성 유지)
          type: image.mime,  // 호환성을 위한 중복 필드
          name: image.filename || `image_${Date.now()}.jpg`,
          size: image.size,
          width: image.width,
          height: image.height}))};
    } catch (error) {
      if (error.code === 'E_PICKER_CANCELLED') {
        return { success: false, cancelled: true };
      }
      
      console.error(t('common:imagePicker.logs.multipleSelectError') + ':', error);
      return {
        success: false,
        error: error.message || t('common:imagePicker.errors.multipleSelectFailed')
      };
    }
  }, [imageOptions, t]);

  // 임시 파일 정리
  const cleanupTempFiles = useCallback(() => {
    ImagePicker.clean()
      .then(() => {
        console.log(t('common:imagePicker.logs.cleanupCompleted'));
      })
      .catch((error) => {
        console.warn(t('common:imagePicker.logs.cleanupFailed') + ':', error);
      });
  }, [t]);

  return {
    openGallery,
    openCamera,
    showImagePickerOptions,
    openMultipleGallery,
    cleanupTempFiles};
};

export default useImagePicker;