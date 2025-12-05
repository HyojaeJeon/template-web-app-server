// ===============================================
// 조건부 옵션 평가 유틸리티
// Location: /server/src/shared/utils/utilities/ConditionalOptionsEvaluator.js
// Purpose: Phase 2.2 조건부 옵션 시스템의 조건 평가 로직
// ===============================================

/**
 * 조건부 옵션 그룹의 표시 여부를 평가합니다.
 *
 * @param {Object} optionGroup - 평가할 옵션 그룹 (MenuOptionGroup 인스턴스 또는 plain object)
 * @param {Array<Object>} selectedOptions - 사용자가 선택한 옵션들 [{ groupId, optionId, quantity }]
 * @returns {boolean} - 옵션 그룹을 표시할지 여부
 *
 * @example
 * // 조건부 옵션 그룹 (치즈가 선택되었을 때만 표시)
 * const cheeseTypeGroup = {
 *   id: 3,
 *   parentOptionId: 5,
 *   conditionalDisplay: {
 *     showIf: {
 *       parentOptionId: 5,
 *       selectedValue: true
 *     }
 *   }
 * };
 *
 * const selectedOptions = [
 *   { groupId: 2, optionId: 5, quantity: 1 }  // "치즈" 옵션 선택
 * ];
 *
 * const shouldShow = evaluateConditionalDisplay(cheeseTypeGroup, selectedOptions);
 * // => true (치즈가 선택되었으므로 치즈 종류 그룹 표시)
 */
export function evaluateConditionalDisplay(optionGroup, selectedOptions = []) {
  // 1. conditionalDisplay가 없으면 항상 표시
  if (!optionGroup.conditionalDisplay) {
    return true;
  }

  const { conditionalDisplay } = optionGroup;

  // 2. conditionalDisplay 유효성 검증
  if (typeof conditionalDisplay !== 'object' || !conditionalDisplay.showIf) {
    console.warn(`[ConditionalOptionsEvaluator] Invalid conditionalDisplay format:`, conditionalDisplay);
    return true;  // 포맷이 잘못되면 기본적으로 표시
  }

  const { showIf } = conditionalDisplay;
  const { parentOptionId, selectedValue } = showIf;

  // 3. parentOptionId가 없으면 항상 표시
  if (!parentOptionId) {
    return true;
  }

  // 4. 선택된 옵션 중에서 parentOptionId와 일치하는 것 찾기
  const parentOption = selectedOptions.find(
    opt => String(opt.optionId) === String(parentOptionId)
  );

  // 5. 조건 평가
  if (selectedValue === true) {
    // 부모 옵션이 선택되어야 표시
    return !!parentOption;
  } else if (selectedValue === false) {
    // 부모 옵션이 선택되지 않아야 표시
    return !parentOption;
  }

  // 기본값: 항상 표시
  return true;
}

/**
 * 여러 옵션 그룹을 일괄 필터링합니다.
 *
 * @param {Array<Object>} optionGroups - 평가할 옵션 그룹 배열
 * @param {Array<Object>} selectedOptions - 사용자가 선택한 옵션들
 * @returns {Array<Object>} - 조건을 만족하는 옵션 그룹만 반환
 *
 * @example
 * const allOptionGroups = [
 *   { id: 1, name: '사이즈', conditionalDisplay: null },
 *   { id: 2, name: '토핑', conditionalDisplay: null },
 *   { id: 3, name: '치즈 종류', parentOptionId: 5, conditionalDisplay: {...} }
 * ];
 *
 * const selectedOptions = [
 *   { groupId: 1, optionId: 1, quantity: 1 },  // "Large" 선택
 *   { groupId: 2, optionId: 5, quantity: 1 }   // "치즈" 선택
 * ];
 *
 * const visibleGroups = filterVisibleOptionGroups(allOptionGroups, selectedOptions);
 * // => [그룹1, 그룹2, 그룹3] (모두 표시)
 */
export function filterVisibleOptionGroups(optionGroups, selectedOptions = []) {
  if (!Array.isArray(optionGroups)) {
    console.warn(`[ConditionalOptionsEvaluator] optionGroups must be an array`);
    return [];
  }

  return optionGroups.filter(group =>
    evaluateConditionalDisplay(group, selectedOptions)
  );
}

/**
 * 조건부 옵션 그룹에 isVisible 필드를 추가합니다.
 * (리졸버에서 사용하기 편리하도록)
 *
 * @param {Array<Object>} optionGroups - 옵션 그룹 배열
 * @param {Array<Object>} selectedOptions - 사용자가 선택한 옵션들
 * @returns {Array<Object>} - isVisible 필드가 추가된 옵션 그룹 배열
 *
 * @example
 * const groups = annotateVisibilityStatus(allOptionGroups, selectedOptions);
 * // => [
 * //   { id: 1, name: '사이즈', isVisible: true },
 * //   { id: 2, name: '토핑', isVisible: true },
 * //   { id: 3, name: '치즈 종류', isVisible: true }
 * // ]
 */
export function annotateVisibilityStatus(optionGroups, selectedOptions = []) {
  if (!Array.isArray(optionGroups)) {
    console.warn(`[ConditionalOptionsEvaluator] optionGroups must be an array`);
    return [];
  }

  return optionGroups.map(group => ({
    ...group,
    isVisible: evaluateConditionalDisplay(group, selectedOptions),
  }));
}

/**
 * conditionalDisplay JSON 구조의 유효성을 검증합니다.
 *
 * @param {Object} conditionalDisplay - 검증할 conditionalDisplay 객체
 * @returns {Object} - { valid: boolean, errors: string[] }
 *
 * @example
 * const result = validateConditionalDisplay({
 *   showIf: {
 *     parentOptionId: 5,
 *     selectedValue: true
 *   }
 * });
 * // => { valid: true, errors: [] }
 */
export function validateConditionalDisplay(conditionalDisplay) {
  const errors = [];

  // null 또는 undefined는 유효 (조건 없음)
  if (conditionalDisplay === null || conditionalDisplay === undefined) {
    return { valid: true, errors };
  }

  // 객체 타입 확인
  if (typeof conditionalDisplay !== 'object' || Array.isArray(conditionalDisplay)) {
    errors.push('conditionalDisplay must be an object');
    return { valid: false, errors };
  }

  // showIf 필드 확인
  if (!conditionalDisplay.showIf) {
    errors.push('conditionalDisplay must have showIf field');
    return { valid: false, errors };
  }

  const { showIf } = conditionalDisplay;

  // showIf가 객체인지 확인
  if (typeof showIf !== 'object' || Array.isArray(showIf)) {
    errors.push('showIf must be an object');
    return { valid: false, errors };
  }

  // parentOptionId 확인
  if (showIf.parentOptionId !== undefined) {
    const idType = typeof showIf.parentOptionId;
    if (idType !== 'number' && idType !== 'string') {
      errors.push('parentOptionId must be a number or string');
    }
  }

  // selectedValue 확인
  if (showIf.selectedValue !== undefined) {
    if (typeof showIf.selectedValue !== 'boolean') {
      errors.push('selectedValue must be a boolean');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 디버깅용: 조건 평가 과정을 상세히 로그로 출력합니다.
 *
 * @param {Object} optionGroup - 평가할 옵션 그룹
 * @param {Array<Object>} selectedOptions - 선택된 옵션들
 * @returns {Object} - { shouldShow: boolean, reason: string }
 */
export function debugConditionalEvaluation(optionGroup, selectedOptions = []) {
  const result = {
    optionGroupId: optionGroup.id,
    optionGroupName: optionGroup.name,
    shouldShow: true,
    reason: '조건 없음 - 항상 표시',
  };

  if (!optionGroup.conditionalDisplay) {
    return result;
  }

  const { conditionalDisplay } = optionGroup;

  if (!conditionalDisplay.showIf) {
    result.reason = 'showIf 필드 없음 - 기본 표시';
    return result;
  }

  const { showIf } = conditionalDisplay;
  const { parentOptionId, selectedValue } = showIf;

  if (!parentOptionId) {
    result.reason = 'parentOptionId 없음 - 기본 표시';
    return result;
  }

  const parentOption = selectedOptions.find(
    opt => String(opt.optionId) === String(parentOptionId)
  );

  if (selectedValue === true) {
    result.shouldShow = !!parentOption;
    result.reason = parentOption
      ? `부모 옵션(ID: ${parentOptionId})이 선택되어 표시`
      : `부모 옵션(ID: ${parentOptionId})이 선택되지 않아 숨김`;
  } else if (selectedValue === false) {
    result.shouldShow = !parentOption;
    result.reason = !parentOption
      ? `부모 옵션(ID: ${parentOptionId})이 선택되지 않아 표시`
      : `부모 옵션(ID: ${parentOptionId})이 선택되어 숨김`;
  }

  return result;
}

// Default export
export default {
  evaluateConditionalDisplay,
  filterVisibleOptionGroups,
  annotateVisibilityStatus,
  validateConditionalDisplay,
  debugConditionalEvaluation,
};
