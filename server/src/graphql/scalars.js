// ===============================================
// Custom Scalar 리졸버
// Location: /shared/resolvers/scalars.js
// Date: 2025-09-10
// ===============================================
// DateTime, JSON, Decimal 등 커스텀 스칼라 리졸버
// ===============================================

import { GraphQLScalarType, Kind } from 'graphql';
import { GraphQLJSON } from 'graphql-type-json';

// DateTime 스칼라
export const DateTime = new GraphQLScalarType({
  name: 'DateTime',
  description: 'JavaScript Date 객체를 나타내는 ISO-8601 날짜/시간 문자열',
  
  serialize(value) {
    // DB에서 클라이언트로: Date 객체를 ISO 문자열로
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  },
  
  parseValue(value) {
    // 클라이언트에서 서버로: ISO 문자열을 Date 객체로
    if (typeof value === 'string') {
      return new Date(value);
    }
    return value;
  },
  
  parseLiteral(ast) {
    // GraphQL 쿼리 리터럴 파싱
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  }
});

// Date 스칼라 (날짜만)
export const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: '날짜만 나타내는 YYYY-MM-DD 형식',
  
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return value;
  },
  
  parseValue(value) {
    if (typeof value === 'string') {
      return new Date(value + 'T00:00:00.000Z');
    }
    return value;
  },
  
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value + 'T00:00:00.000Z');
    }
    return null;
  }
});

// Decimal 스칼라 (정밀한 숫자 처리)
export const Decimal = new GraphQLScalarType({
  name: 'Decimal',
  description: '정밀한 10진수 값 (통화 등)',
  
  serialize(value) {
    // DB의 Decimal을 문자열로 반환 (정밀도 유지)
    if (value && value.toString) {
      return value.toString();
    }
    return value;
  },
  
  parseValue(value) {
    // 클라이언트에서 받은 값을 숫자로 변환
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  },
  
  parseLiteral(ast) {
    if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
      return parseFloat(ast.value);
    }
    if (ast.kind === Kind.STRING) {
      return parseFloat(ast.value);
    }
    return null;
  }
});

// Upload 스칼라 (파일 업로드)
export const Upload = new GraphQLScalarType({
  name: 'Upload',
  description: '파일 업로드를 위한 스칼라',
  
  parseValue(value) {
    return value; // graphql-upload에서 처리
  },
  
  parseLiteral() {
    throw new Error('Upload 스칼라는 변수를 통해서만 사용 가능합니다');
  },
  
  serialize() {
    throw new Error('Upload 스칼라는 직렬화할 수 없습니다');
  }
});

// 모든 스칼라 리졸버 export
export default {
  DateTime,
  Date: DateScalar,
  JSON: GraphQLJSON,
  Decimal,
  Upload
};