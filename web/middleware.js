import { NextResponse } from 'next/server';

// 성능 모니터링을 위한 메모리 기반 저장소
const performanceMetrics = new Map();
const rateLimitStore = new Map();

// 환경 변수
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100');
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000'); // 1분

/**
 * 토큰 검증 함수 (임시)
 * 실제 구현 시 jsonwebtoken 라이브러리 사용 필요
 */
function verifyToken(token) {
  // 임시 구현 - 실제로는 JWT 검증 로직 필요
  if (!token) {
    return { valid: false, decoded: null };
  }
  
  // 개발 환경에서는 모든 토큰을 유효한 것으로 처리
  if (process.env.NODE_ENV === 'development') {
    return {
      valid: true,
      decoded: {
        id: 'dev-user',
        role: 'store_owner'
      }
    };
  }
  
  return { valid: false, decoded: null };
}

/**
 * Next.js 13+ 미들웨어
 * 성능 최적화, 보안 헤더 설정 및 인증 처리
 */
export function middleware(request) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;
  
  try {
    // 1. Rate Limiting 체크 (API 경로 및 중요 경로)
    if (needsRateLimit(pathname)) {
      const rateLimitResult = checkRateLimit(clientIP);
      if (!rateLimitResult.allowed) {
        const response = new NextResponse('Rate limit exceeded', { status: 429 });
        addPerformanceHeaders(response, startTime);
        addRateLimitHeaders(response, rateLimitResult);
        return response;
      }
    }

    // 2. 기본 응답 생성
    const response = NextResponse.next();
    
    // 3. 성능 헤더 추가
    addPerformanceHeaders(response, startTime);
    
    // 4. 보안 헤더 설정 (개발 환경에서는 비활성화)
    if (process.env.NODE_ENV === 'production') {
      setSecurityHeaders(response);
    }
    
    // 5. Local 현지화 헤더
    addLocalizationHeaders(response);
    
    // 6. API 라우트 인증 처리
    if (request.nextUrl.pathname.startsWith('/api/protected')) {
      return handleAPIAuth(request, response);
    }
    
    // 7. 대시보드 페이지는 클라이언트 사이드에서 인증 처리
    // 미들웨어에서는 보안 헤더만 설정하고 통과시킴

    // 8. 성능 메트릭 수집
    collectMetrics(request, response, startTime);
    
    return response;
    
  } catch (error) {
    console.error('미들웨어 오류:', error);
    const response = new NextResponse('Internal Server Error', { status: 500 });
    addPerformanceHeaders(response, startTime);
    return response;
  }
}

/**
 * 클라이언트 IP 추출
 */
function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  return 'unknown';
}

/**
 * Rate Limiting이 필요한 경로인지 확인
 */
function needsRateLimit(pathname) {
  const rateLimitPaths = [
    '/api/',
    '/dashboard',
    '/login',
    '/register'
  ];

  return rateLimitPaths.some(path => pathname.startsWith(path));
}

/**
 * Rate Limiting 체크
 */
function checkRateLimit(clientID, maxRequests = RATE_LIMIT_MAX, windowMs = RATE_LIMIT_WINDOW) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // 클라이언트별 요청 기록 조회
  const clientRequests = rateLimitStore.get(clientID) || [];
  
  // 시간 윈도우 내의 요청만 필터링
  const recentRequests = clientRequests.filter(timestamp => timestamp > windowStart);
  
  // 현재 요청 추가
  recentRequests.push(now);
  rateLimitStore.set(clientID, recentRequests);
  
  return {
    allowed: recentRequests.length <= maxRequests,
    remaining: Math.max(0, maxRequests - recentRequests.length),
    resetTime: now + windowMs
  };
}

/**
 * 성능 헤더 추가
 */
function addPerformanceHeaders(response, startTime) {
  const duration = Date.now() - startTime;
  const requestId = crypto.randomUUID();
  
  response.headers.set('X-Response-Time', `${duration}ms`);
  response.headers.set('X-Request-ID', requestId);
  response.headers.set('X-Served-By', 'app-middleware');
  response.headers.set('X-Cache-Status', 'MISS'); // CDN에서 오버라이드 될 수 있음
  
  // 성능 경고 (500ms 이상)
  if (duration > 500) {
    response.headers.set('X-Performance-Warning', 'slow-response');
    console.warn(`느린 응답 감지: ${duration}ms`);
  }
}

/**
 * Rate Limit 헤더 추가
 */
function addRateLimitHeaders(response, rateLimitResult) {
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
  response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString());
}

/**
 * Localization headers
 */
function addLocalizationHeaders(response) {
  response.headers.set('X-Country', 'VN');
  response.headers.set('X-Currency', 'VND');
  response.headers.set('X-Timezone', 'Asia/Ho_Chi_Minh');
  response.headers.set('X-Language', 'vi');
}

/**
 * 성능 메트릭 수집
 */
function collectMetrics(request, response, startTime) {
  const metrics = {
    url: request.nextUrl.pathname,
    method: request.method,
    duration: Date.now() - startTime,
    status: response.status,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString()
  };
  
  // 메모리에 임시 저장 (프로덕션에서는 외부 모니터링 서비스로 전송)
  performanceMetrics.set(crypto.randomUUID(), metrics);
  
  // 메모리 정리 (최대 1000개 유지)
  if (performanceMetrics.size > 1000) {
    const oldestKey = performanceMetrics.keys().next().value;
    performanceMetrics.delete(oldestKey);
  }
  
  // 콘솔 로깅 (개발 모드)
  if (process.env.NODE_ENV === 'development') {
    console.log('성능 메트릭:', metrics);
  }
}

/**
 * 보안 헤더 설정
 */
function setSecurityHeaders(response) {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.googleusercontent.com https://maps.gstatic.com https://maps.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.example.com https://maps.googleapis.com ws://localhost:* wss://*",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // HSTS (HTTP Strict Transport Security)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (Feature Policy)
  const permissions = [
    'camera=(self)',
    'microphone=()',
    'geolocation=(self)',
    'payment=(self)',
    'usb=()',
    'interest-cohort=()'
  ].join(', ');
  response.headers.set('Permissions-Policy', permissions);

  // Cross-Origin Embedder Policy
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // Cross-Origin Opener Policy
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  // Cross-Origin Resource Policy
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return response;
}

/**
 * API 라우트 인증 처리
 */
function handleAPIAuth(request, response) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const { valid, decoded } = verifyToken(token);
  
  if (!valid) {
    return NextResponse.json(
      { error: '유효하지 않은 토큰입니다.' },
      { status: 401 }
    );
  }

  // 사용자 정보를 헤더에 추가
  response.headers.set('x-user-id', decoded.id);
  response.headers.set('x-user-role', decoded.role);
  
  return response;
}

/**
 * 대시보드 인증 처리
 */
function handleDashboardAuth(request, response) {
  // 클라이언트 사이드에서 처리할 것이므로 헤더만 설정
  const token = request.cookies.get('auth-token')?.value;
  
  if (token) {
    const { valid, decoded } = verifyToken(token);
    
    if (valid) {
      response.headers.set('x-user-authenticated', 'true');
      response.headers.set('x-user-role', decoded.role);
    }
  }
  
  return response;
}

// 미들웨어 적용 경로 설정
export const config = {
  matcher: [
    // API 라우트
    '/api/:path*',
    // 대시보드 페이지
    '/dashboard/:path*',
    // 인증 페이지 (보안 헤더만)
    '/(auth)/:path*',
    // 기타 보안이 필요한 경로
    '/settings/:path*',
    '/staff/:path*'
  ]
};