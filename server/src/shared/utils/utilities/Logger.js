// 간단한 로거 (대소문자 일치를 위한 alias)
// DataLoader에서 import logger가 실패하는 경우를 위한 대안

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const ICONS = { error: '❌', warn: '⚠️', info: '✅', debug: '🔎' };
function currentLevel() {
  const lvl = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return LEVELS[lvl] !== undefined ? LEVELS[lvl] : LEVELS.info;
}
function shouldLog(level) {
  return LEVELS[level] <= currentLevel();
}

function toLine(level, message, meta) {
  const icon = ICONS[level] || '';
  const ts = new Date().toISOString();
  const fmt = (process.env.LOG_FORMAT || (process.env.NODE_ENV === 'development' ? 'pretty' : 'json')).toLowerCase();

  if (fmt === 'pretty') {
    // 사람이 읽기 쉬운 한 줄 로그: [시간] 아이콘 레벨 - 메시지 key=value ...
    const parts = [];
    parts.push(`[${ts}]`);
    parts.push(icon || level.toUpperCase());
    parts.push(level.toUpperCase());
    parts.push('-');
    parts.push(message);
    if (meta && typeof meta === 'object') {
      for (const [k, v] of Object.entries(meta)) {
        if (v === undefined) continue;
        const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
        parts.push(`${k}=${val}`);
      }
    }
    return parts.join(' ');
  }

  // JSON 라인 포맷
  const base = { level, icon, msg: icon ? `${icon} ${message}` : message, ts };
  if (meta && typeof meta === 'object') return JSON.stringify({ ...base, ...meta });
  if (meta !== undefined) return JSON.stringify({ ...base, meta });
  return JSON.stringify(base);
}

const logger = {
  info: (message, meta) => { if (shouldLog('info')) console.log(toLine('info', message, meta)); },
  error: (message, meta) => { if (shouldLog('error')) console.error(toLine('error', message, meta)); },
  warn: (message, meta) => { if (shouldLog('warn')) console.warn(toLine('warn', message, meta)); },
  debug: (message, meta) => { if (shouldLog('debug')) console.log(toLine('debug', message, meta)); },
};

// 대소문자 모두 지원
export { logger, logger as Logger };
export default logger;
