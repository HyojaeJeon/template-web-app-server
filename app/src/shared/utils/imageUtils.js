/**
 * Image Utility Functions
 * 이미지 처리를 위한 유틸리티 함수들
 */
import RNFS from 'react-native-fs';

/**
 * 이미지를 Base64로 변환하는 함수
 * @param {Object} imageInfo - react-native-image-crop-picker 또는 CameraRoll에서 반환된 이미지 정보
 * @returns {Promise<Object>} Base64 데이터와 메타데이터
 */
export const convertImageToBase64 = async (imageInfo) => {
  try {
    // URI 정규화 (iOS CameraRoll 대응)
    let filePath = imageInfo.path || imageInfo.uri;

    // iOS file:// URI 처리
    if (filePath.startsWith('file://')) {
      filePath = filePath.replace('file://', '');
    }

    // ph:// (iOS Photos) URI 처리
    if (filePath.startsWith('ph://')) {
      console.log('[imageUtils] iOS Photos URI detected, using copyAssetsFileIOS');

      // iOS Photos library의 이미지를 임시 파일로 복사
      const destPath = `${RNFS.TemporaryDirectoryPath}/${Date.now()}.jpg`;
      await RNFS.copyAssetsFileIOS(filePath, destPath, 0, 0);
      filePath = destPath;
    }

    console.log('[imageUtils] Reading file:', filePath);

    // 파일 존재 여부 확인
    const exists = await RNFS.exists(filePath);
    if (!exists) {
      console.error('[imageUtils] File not found:', filePath);
      throw new Error('Image file not found');
    }

    // Base64로 변환
    const base64Data = await RNFS.readFile(filePath, 'base64');

    // 파일명 생성 (타임스탬프 포함)
    const timestamp = Date.now();
    const extension = imageInfo.mime?.split('/')[1] || 'jpg';
    const filename = `profile_${timestamp}.${extension}`;

    return {
      base64: base64Data,
      filename: filename,
      mimetype: imageInfo.mime || 'image/jpeg',
      size: imageInfo.size,
      width: imageInfo.width,
      height: imageInfo.height
    };
  } catch (error) {
    console.error('convertImageToBase64 error:', error);
    throw new Error('Failed to convert image to Base64');
  }
};

/**
 * 이미지 크기를 포맷팅하는 함수
 * @param {number} bytes - 바이트 크기
 * @returns {string} 포맷된 크기 문자열
 */
export const formatImageSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 이미지가 유효한 형식인지 확인하는 함수
 * @param {string} mimetype - MIME 타입
 * @returns {boolean} 유효 여부
 */
export const isValidImageType = (mimetype) => {
  if (!mimetype) {
    console.warn('No mimetype provided, assuming valid');
    return true; // MIME 타입이 없으면 일단 허용
  }

  const normalizedMime = mimetype.toLowerCase();

  // 다양한 MIME 타입 지원 (iOS/Android 호환성)
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',    // iOS HEIC 형식
    'image/heif',    // iOS HEIF 형식
    'image/gif',     // GIF 지원
  ];

  // MIME 타입이 image/로 시작하면 기본적으로 허용
  if (normalizedMime.startsWith('image/')) {
    return true;
  }

  return validTypes.includes(normalizedMime);
};

/**
 * 이미지 크기가 제한 내인지 확인하는 함수
 * @param {number} size - 이미지 크기 (bytes)
 * @param {number} maxSizeMB - 최대 크기 (MB)
 * @returns {boolean} 유효 여부
 */
export const isValidImageSize = (size, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
};