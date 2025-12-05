/**
 * LinearGradient 안전 유틸리티
 * iOS 네이티브 크래시 방지를 위한 colors 배열 검증 및 보정
 */

/**
 * 기본 안전 색상 팔레트 (Local 테마)
 */
const DEFAULT_COLORS = {
  primary: ['#2AC1BC', '#1FA09B'],
  secondary: ['#00B14F', '#009A42'],
  gray: ['#9CA3AF', '#6B7280'],
  error: ['#EF4444', '#DC2626'],
  warning: ['#F59E0B', '#D97706'],
  success: ['#10B981', '#059669'],
  light: ['#F3F4F6', '#E5E7EB']
};

/**
 * 단일 색상을 그라데이션으로 변환 (밝은 색 → 어두운 색)
 * @param {string} color - 기본 색상 (hex)
 * @returns {string[]} - 2개 색상 배열
 */
export const createGradientFromSingle = (color) => {
  if (!color || typeof color !== 'string') {
    return DEFAULT_COLORS.gray;
  }

  // hex 색상 검증
  if (!color.startsWith('#') || color.length !== 7) {
    return DEFAULT_COLORS.gray;
  }

  try {
    // hex를 RGB로 변환
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);

    // 어두운 버전 생성 (약 20% 어둡게)
    const darkR = Math.max(0, Math.floor(r * 0.8));
    const darkG = Math.max(0, Math.floor(g * 0.8));
    const darkB = Math.max(0, Math.floor(b * 0.8));

    const darkHex = `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;

    return [color, darkHex];
  } catch (error) {
    console.warn('Failed to create gradient from color:', color, error);
    return DEFAULT_COLORS.gray;
  }
};

/**
 * 색상 배열의 유효성 검증
 * @param {string} color - 색상 문자열
 * @returns {boolean} - 유효성 여부
 */
export const isValidColor = (color) => {
  if (!color || typeof color !== 'string') {
    return false;
  }

  // hex 색상 (#RRGGBB)
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
    return /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(color);
  }

  // rgba/rgb 색상
  if (color.startsWith('rgb')) {
    return /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color);
  }

  // 기본 색상명
  const namedColors = ['transparent', 'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey'];
  return namedColors.includes(color.toLowerCase());
};

/**
 * 안전한 LinearGradient colors 배열 반환
 * @param {string[]|string} colors - 입력 색상 (배열 또는 단일 색상)
 * @param {string[]} fallback - 대체 색상 배열
 * @returns {string[]} - 최소 2개의 유효한 색상 배열
 */
export const getSafeGradient = (colors, fallback = DEFAULT_COLORS.primary) => {
  // 입력값이 없거나 잘못된 경우
  if (!colors) {
    return fallback;
  }

  // 단일 색상 문자열인 경우
  if (typeof colors === 'string') {
    return createGradientFromSingle(colors);
  }

  // 배열이 아닌 경우
  if (!Array.isArray(colors)) {
    return fallback;
  }

  // 유효한 색상만 필터링
  const validColors = colors.filter(isValidColor);

  // 유효한 색상이 2개 이상인 경우
  if (validColors.length >= 2) {
    return validColors;
  }

  // 유효한 색상이 1개인 경우 - 그라데이션으로 변환
  if (validColors.length === 1) {
    return createGradientFromSingle(validColors[0]);
  }

  // 유효한 색상이 없는 경우 - 대체 색상 반환
  return fallback;
};

/**
 * 테마별 안전한 그라데이션 반환
 * @param {string} theme - 테마명 (primary, secondary, error, etc.)
 * @returns {string[]} - 안전한 색상 배열
 */
export const getSafeThemeGradient = (theme) => {
  return DEFAULT_COLORS[theme] || DEFAULT_COLORS.primary;
};

/**
 * LinearGradient props 검증 및 보정
 * @param {object} props - LinearGradient props
 * @returns {object} - 안전한 props
 */
export const validateGradientProps = (props) => {
  const safeProps = { ...props };

  // colors 배열 보정
  safeProps.colors = getSafeGradient(props.colors);

  // start/end 값 검증 및 기본값 설정
  if (!props.start || typeof props.start !== 'object') {
    safeProps.start = { x: 0, y: 0 };
  }

  if (!props.end || typeof props.end !== 'object') {
    safeProps.end = { x: 1, y: 1 };
  }

  return safeProps;
};

export default {
  getSafeGradient,
  getSafeThemeGradient,
  createGradientFromSingle,
  isValidColor,
  validateGradientProps,
  DEFAULT_COLORS
};