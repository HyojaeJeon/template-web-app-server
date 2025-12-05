/**
 * Elasticsearch 연결 설정 및 클라이언트
 * Local App MVP를 위한 검색 시스템 연결 관리
 */

import { Client } from '@elastic/elasticsearch';
import { logger as appLogger } from '../shared/utils/utilities/Logger.js';
import { elasticsearchConfig as envEsConfig } from './env.js';

const logger = {
  info: (msg, meta) => appLogger.info(msg, meta),
  error: (msg, meta) => appLogger.error(msg, meta),
  warn: (msg, meta) => appLogger.warn(msg, meta),
  debug: (msg, meta) => appLogger.debug(msg, meta),
};

// Elasticsearch 연결 설정 - 환경별 설정 사용
const createElasticsearchConnection = (config = {}) => {
  const defaultConfig = {
    node: envEsConfig.node,
    requestTimeout: 30000,
    maxRetries: 3,
    ssl: {
      rejectUnauthorized: false
    },
    ...config,
  };

  // 인증 설정
  if (envEsConfig.username && envEsConfig.password) {
    defaultConfig.auth = {
      username: envEsConfig.username,
      password: envEsConfig.password,
    };
  }

  const client = new Client(defaultConfig);
  logger.info('Elasticsearch client configured', { node: defaultConfig.node });
  return client;
};

// Elasticsearch 클라이언트 인스턴스
export const elasticsearchClient = createElasticsearchConnection();
export const esClient = elasticsearchClient; // 호환성을 위한 별칭

// Elasticsearch 연결 초기화
export const initializeElasticsearch = async () => {
  try {
    // 클러스터 상태 직접 확인 (ping 대신)
    const health = await elasticsearchClient.cluster.health({
      timeout: '5s',
    });

    logger.info('✅ Elasticsearch 검색 엔진 연결됨', {
      cluster_name: health.cluster_name,
      status: health.status,
      number_of_nodes: health.number_of_nodes,
      number_of_data_nodes: health.number_of_data_nodes,
    });

    return true;
  } catch (error) {
    // 더 자세한 에러 정보 제공
    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || 'UNKNOWN';

    if (error.code === 'ECONNREFUSED') {
      logger.warn('Elasticsearch 연결 거부 - 검색 기능 제한');
    } else if (error.name === 'TimeoutError') {
      logger.warn('Elasticsearch 연결 타임아웃 - 검색 기능 제한');
    } else {
      logger.error('Elasticsearch 연결 실패', { error: errorMessage, code: errorCode, type: error.name, statusCode: error.statusCode });
    }

    return false;
  }
};

// Elasticsearch 연결 상태 확인
export const checkElasticsearchConnection = async () => {
  try {
    const startTime = Date.now();
    const health = await elasticsearchClient.cluster.health();
    const responseTime = Date.now() - startTime;

    return { status: 'OK', cluster_status: health.status, responseTime, lastCheck: new Date().toISOString(), cluster_name: health.cluster_name, number_of_nodes: health.number_of_nodes };
  } catch (error) {
    return {
      status: 'DOWN',
      responseTime: -1,
      lastCheck: new Date().toISOString(),
      error: error.message,
    };
  }
};

// 인덱스 이름 상수 (중앙 집중 관리)
export const ELASTICSEARCH_INDICES = {
  SEARCH_HISTORY: 'duri_search_history',
};

// Local어 분석기 설정 (공통 설정)
export const ELASTICSEARCH_SETTINGS = {
  number_of_shards: 1,
  number_of_replicas: 0, // 개발 환경
  max_result_window: 50000,
  max_ngram_diff: 2, // ngram min_gram과 max_gram 차이 허용 (1→3 = 2)
  analysis: {
    analyzer: {
      // 멀티 언어 analyzer (ICU 플러그인 활용)
      multilang_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: [
          'lowercase',
          'icu_folding', // asciifolding 대신 ICU folding (성조 처리 개선)
          'multilang_stop',
          'cjk_width',
          'remove_duplicates',
        ],
      },
      // 검색용 analyzer
      multilang_search_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: [
          'lowercase',
          'icu_folding', // asciifolding 대신 ICU folding
          'multilang_stop',
          'cjk_width',
        ],
      },
      // 한국어 특화 (Nori 형태소 분석기 사용)
      korean_analyzer: {
        type: 'custom',
        tokenizer: 'nori_tokenizer', // Nori 토크나이저 사용
        filter: [
          'lowercase',
          'nori_readingform', // 한자 읽기 변환
          'nori_part_of_speech', // 불필요한 품사 제거
          'korean_stop',
          'remove_duplicates',
        ],
      },
      // 한국어 자동완성 (Ngram - 찌개, 김치 등 부분 검색)
      korean_ngram_analyzer: {
        type: 'custom',
        tokenizer: 'korean_ngram_tokenizer',
        filter: [
          'lowercase',
        ],
      },
      // Local어 특화 (ICU 활용)
      vietnamese_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: [
          'lowercase',
          'icu_folding', // Local어 성조 처리
          'vietnamese_stop',
          'remove_duplicates',
        ],
      },
      // 자동완성 (Edge Ngram)
      autocomplete_analyzer: {
        type: 'custom',
        tokenizer: 'autocomplete_tokenizer',
        filter: [
          'lowercase',
          'icu_folding', // 성조 무시 자동완성
        ],
      },
      // 자동완성 검색
      search_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: [
          'lowercase',
          'icu_folding',
        ],
      },
    },
    tokenizer: {
      // Nori 토크나이저 설정 (한국어 형태소 분석)
      nori_tokenizer: {
        type: 'nori_tokenizer',
        decompound_mode: 'mixed', // 복합어 분해 모드
        user_dictionary_rules: [ // 사용자 사전
          '김치찌개', '된장찌개', '순두부찌개', // 한국 음식
          '반미', '쌀국수', '분짜', // Local 음식 한국어 표현
        ],
      },
      // 한국어 Ngram 토크나이저 (부분 검색용)
      korean_ngram_tokenizer: {
        type: 'ngram',
        min_gram: 1,
        max_gram: 3,
        token_chars: ['letter', 'digit'],
      },
      // 자동완성용 Edge Ngram 토크나이저
      autocomplete_tokenizer: {
        type: 'edge_ngram',
        min_gram: 1,
        max_gram: 20,
        token_chars: ['letter', 'digit'],
      },
    },
    filter: {
      // Nori 품사 필터 (불필요한 품사 제거)
      nori_part_of_speech: {
        type: 'nori_part_of_speech',
        stoptags: [
          'E', // 어미
          'IC', // 감탄사
          'J', // 조사
          'MAG', // 일반 부사
          'MAJ', // 접속 부사
          'MM', // 관형사
          'SP', // 공백
          'SSC', // 닫는 괄호
          'SSO', // 여는 괄호
          'SC', // 구분자
          'SE', // 줄임표
          'XPN', // 접두사
          'XSA', // 형용사 파생 접미사
          'XSN', // 명사 파생 접미사
          'XSV', // 동사 파생 접미사
        ],
      },
      multilang_stop: {
        type: 'stop',
        stopwords: [
          // Local어 불용어
          'và', 'của', 'có', 'được', 'một', 'là', 'với', 'trong', 'cho', 'từ',
          'về', 'tại', 'này', 'đó', 'các', 'những', 'người', 'như', 'không',
          // 한국어 불용어
          '이', '그', '저', '것', '들', '의', '가', '을', '를', '에',
          // 영어 불용어
          'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
        ],
      },
      vietnamese_stop: {
        type: 'stop',
        stopwords: [
          'và', 'của', 'có', 'được', 'một', 'là', 'với', 'trong', 'cho', 'từ',
          'về', 'tại', 'này', 'đó', 'các', 'những', 'người', 'như', 'không',
        ],
      },
      korean_stop: {
        type: 'stop',
        stopwords: [
          '이', '그', '저', '것', '들', '의', '가', '을', '를', '에',
          '로', '으로', '와', '과', '도', '만', '까지', '부터',
        ],
      },
      edge_ngram_filter: {
        type: 'edge_ngram',
        min_gram: 2,
        max_gram: 10,
      },
      remove_duplicates: {
        type: 'unique',
        only_on_same_position: true,
      },
    },
  },
};

export default elasticsearchClient;
