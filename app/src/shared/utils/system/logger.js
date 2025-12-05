const safeConsole = (typeof globalThis !== 'undefined' && globalThis.console)
  ? globalThis.console
  : {
      log: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      group: () => {},
      groupEnd: () => {},
      time: () => {},
      timeEnd: () => {}
    };

class Logger {
  constructor() {
    this.isDevelopment = __DEV__;
    this.logLevel = this.isDevelopment ? 'debug' : 'error';
    // Fixed version v2 - 완전히 안전한 logger
  }

  debug(message, data = null) {
    if (this.isDevelopment) {
      safeConsole.log('[DEBUG] ' + String(message));
      if (data) {
        safeConsole.log('[DEBUG DATA]:', data);
      }
    }
  }

  info(message, data = null) {
    // 토큰 재갱신과 같은 중요한 정보는 항상 표시
    safeConsole.info('[INFO] ' + String(message));
    if (data && this.isDevelopment) {
      safeConsole.info('[INFO DATA]:', data);
    }
  }

  warn(message, data = null) {
    safeConsole.warn('[WARN] ' + String(message));
    if (data) {
      safeConsole.warn('[WARN DATA]:', data);
    }
  }

  error(message, data = null) {
    try {
      // ✅ AbortError 및 정상 중단 에러 필터링
      const err = data || {};
      if (err?.name === 'AbortError' || /aborted|cancelled/i.test(err?.message || message || '')) {
        // 정상 중단은 warn 또는 debug로 강등
        if (this.isDevelopment) {
          console.warn('[Network] Request aborted:', String(message));
        }
        return;
      }

      // 메시지 안전성 검사
      const safeMessage = message ? String(message) : 'Unknown error';

      // 타임스탬프 생성
      let timestamp;
      try {
        timestamp = new Date().toLocaleTimeString('ko-KR');
      } catch (timeError) {
        timestamp = 'N/A';
      }

      // 기본 에러 로깅
      safeConsole.error('[' + timestamp + '] [ERROR] ' + safeMessage);

      // 데이터가 있는 경우 요약 생성
      if (data !== null && data !== undefined) {
        try {
          const summary = this._summarizeError(data);
          if (summary && typeof summary === 'string' && summary.length > 0) {
            safeConsole.error('└─ ' + String(summary));
          } else {
            // summary가 유효하지 않은 경우 안전하게 처리
            let dataInfo = 'unknown';
            try {
              dataInfo = typeof data + ' | ' + String(data).substring(0, 50);
            } catch (stringError) {
              dataInfo = typeof data;
            }
            safeConsole.error('└─ Error data type: ' + dataInfo);
          }
        } catch (summaryError) {
          // 안전한 에러 메시지 추출
          let errorMessage = 'Error processing failed';
          try {
            if (summaryError && typeof summaryError === 'object' && summaryError.message) {
              errorMessage = String(summaryError.message);
            } else if (summaryError) {
              errorMessage = String(summaryError);
            }
          } catch (msgError) {
            errorMessage = 'Error message extraction failed';
          }

          safeConsole.error('└─ Error summary failed:', errorMessage);
          safeConsole.error('└─ Original data type:', typeof data);
        }
      }
    } catch (err) {
      // 모든 것이 실패한 경우의 최종 안전장치
      try {
        const fallbackMessage = message ? String(message) : 'Critical error';
        safeConsole.error('[ERROR] ' + fallbackMessage);
        if (data) {
          safeConsole.error('Error data type:', typeof data);
        }
      } catch (finalError) {
        safeConsole.error('[CRITICAL] Logger failed completely');
      }
    }
  }

  errorDetail(message, data = null) {
    if (!this.isDevelopment) {return;}

    if (!this.isDevelopment) {return;}
    safeConsole.group('[DEBUG] [ERROR DETAIL] ' + String(message));
    if (data && typeof data === 'object') {
      if (data.message) {console.error('메시지:', data.message);} 
      if (data.networkError) {console.error('네트워크:', data.networkError?.message || 'Network error');}
      if (data.graphQLErrors) {
        console.error('GraphQL 에러:', data.graphQLErrors?.length || 0, '개');
        data.graphQLErrors?.forEach((err, idx) => {
          console.error('  ' + (idx + 1) + '. ' + String(err.message));
        });
      }
      if (data.stack) {console.error('스택:', data.stack.split('\n').slice(0, 3).join('\n'));}
      if (data.code) {console.error('코드:', data.code);}
    } else if (data) {
      console.error('데이터:', String(data));
    }
    safeConsole.groupEnd();
  }

  _summarizeError(data) {
    // 최상위 null/undefined 안전성 검사
    if (data === null || data === undefined) {
      return data === null ? 'null' : 'undefined';
    }

    try {
      // 문자열인 경우 바로 처리
      if (typeof data === 'string') {
        const safeData = String(data);
        return safeData.length > 100 ? safeData.substring(0, 100) + '...' : safeData;
      }

      // 숫자나 불리언인 경우 문자열로 변환
      if (typeof data === 'number' || typeof data === 'boolean') {
        return String(data);
      }

      // 함수인 경우 특별 처리
      if (typeof data === 'function') {
        return 'Function: ' + (data?.name || 'anonymous');
      }

      // 객체가 아닌 경우 문자열로 변환 (symbol, undefined 등)
      if (typeof data !== 'object' || data === null) {
        return String(data);
      }

      // GraphQL 에러 처리 (옵셔널 체이닝 적용)
      if (data?.graphQLErrors && Array.isArray(data.graphQLErrors) && data.graphQLErrors.length > 0) {
        try {
          const firstError = data.graphQLErrors[0];
          if (firstError && typeof firstError === 'object') {
            const message = String(firstError?.message || '알 수 없는 GraphQL 오류');
            const count = data.graphQLErrors.length;
            return 'GraphQL: ' + message + (count > 1 ? ' (+' + String(count - 1) + '개)' : '');
          }
        } catch (gqlError) {
          return 'GraphQL: 에러 파싱 실패';
        }
      }

      // 네트워크 에러 처리 (옵셔널 체이닝 적용)
      if (data?.networkError) {
        try {
          const netErr = data.networkError;
          if (netErr && typeof netErr === 'object') {
            if (netErr?.statusCode) {
              const statusCode = String(netErr.statusCode);
              const message = String(netErr?.message || 'HTTP Error');
              return '네트워크: ' + statusCode + ' ' + message;
            }
            const message = String(netErr?.message || '연결 실패');
            return '네트워크: ' + message;
          }
          return '네트워크: 오류 발생';
        } catch (netError) {
          return '네트워크: 에러 파싱 실패';
        }
      }

      // 일반 Error 객체 처리 (옵셔널 체이닝 적용)
      if (data?.message) {
        try {
          const message = String(data.message);
          const name = String(data?.name || 'Error');
          const shortMessage = message.length > 80 ? message.substring(0, 80) + '...' : message;
          return name + ': ' + shortMessage;
        } catch (msgError) {
          return 'Error: 메시지 파싱 실패';
        }
      }

      // 에러 코드 처리 (옵셔널 체이닝 적용)
      if (data?.code || data?.status) {
        try {
          const code = String(data?.code || data?.status);
          return '코드: ' + code;
        } catch (codeError) {
          return '코드: 파싱 실패';
        }
      }

      // 기타 객체는 간단히 처리
      return 'Object error';

    } catch (error) {
      // 최종 안전장치
      return 'Error summary failed';
    }
  }

  api(method, url, requestData = null, responseData = null) {
    if (this.isDevelopment) {
      safeConsole.group('[API] ' + String(method) + ' ' + String(url));
      if (requestData) {safeConsole.log('Request:', requestData);} 
      if (responseData) {safeConsole.log('Response:', responseData);} 
      safeConsole.groupEnd();
    }
  }

  timeStart(label) {
    if (this.isDevelopment) {
      safeConsole.time('[PERF] ' + String(label));
    }
  }

  timeEnd(label) {
    if (this.isDevelopment) {
      safeConsole.timeEnd('[PERF] ' + String(label));
    }
  }
}

const logger = new Logger();

export default logger;
export { Logger };
