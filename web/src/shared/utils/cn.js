import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS 클래스를 병합하고 조건부로 적용하는 유틸리티
 * clsx로 조건부 클래스를 처리하고 twMerge로 Tailwind 클래스 충돌을 해결
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 별칭 export 추가
export { clsx };