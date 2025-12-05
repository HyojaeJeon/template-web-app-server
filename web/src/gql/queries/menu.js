/**
 * Menu Domain Queries (Stub)
 * TODO: 구현 필요
 */

import { gql } from '../gqlSetup.js';

// 알레르겐 목록 조회
export const S_GET_ALLERGENS = gql`
  query SGetAllergens($isActive: Boolean) {
    sGetAllergens(isActive: $isActive) {
      success
      message
      allergens {
        id
        name
        nameKo
        description
        severity
        isActive
      }
    }
  }
`;
