/**
 * KV Adapter for unified cache system
 * - Wraps RedisConnection when available
 * - Falls back to in-memory store in development
 */

import { redis as redisClient } from '../../config/redis.js';

const memory = new Map();
const memLists = new Map(); // for list ops
const memSets = new Map();  // for Set ops
const memZSets = new Map(); // for Sorted Set ops
const expirations = new Map(); // non-string structures TTL

function touchExpireForKey(key) {
  const exp = expirations.get(key);
  if (exp && Date.now() > exp) {
    memory.delete(key);
    memLists.delete(key);
    memSets.delete(key);
    memZSets.delete(key);
    expirations.delete(key);
    return true;
  }
  const rec = memory.get(key);
  if (rec && rec.expiresAt && Date.now() > rec.expiresAt) {
    memory.delete(key);
    return true;
  }
  return false;
}

const mem = {
  get(key) {
    const rec = memory.get(key);
    if (!rec) return null;
    if (rec.expiresAt && Date.now() > rec.expiresAt) {
      memory.delete(key);
      return null;
    }
    return rec.value;
  },
  setex(key, ttlSeconds, value) {
    memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    return 'OK';
  },
  mget(keys) {
    return keys.map((k) => mem.get(k));
  },
  del(keys) {
    const arr = Array.isArray(keys) ? keys : [keys];
    let n = 0;
    for (const k of arr) {
      if (memory.delete(k)) n++;
    }
    return n;
  },
  async hmget(key, fields = []) {
    const obj = mem.hgetall(key) || {};
    return fields.map((f) => (obj[f] ?? null));
  },
  hgetall(key) {
    const raw = mem.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  hset(key, field, value) {
    const current = mem.hgetall(key) || {};
    current[field] = value;
    memory.set(key, { value: JSON.stringify(current), expiresAt: null });
    return 1;
  }
};

function getRedis() {
  try {
    // ioredis 인스턴스 (config/redis.js 진입점)
    return redisClient || null;
  } catch {
    return null;
  }
}

const kv = {
  async get(key) {
    const client = getRedis();
    if (!client) return mem.get(key);
    return client.get(key);
  },
  async setex(key, ttlSeconds, value) {
    const client = getRedis();
    if (!client) return mem.setex(key, ttlSeconds, value);
    return client.setex(key, ttlSeconds, value);
  },
  async set(key, value) {
    const client = getRedis();
    if (!client) {
      memory.set(key, { value, expiresAt: null });
      return 'OK';
    }
    return client.set(key, value);
  },
  async mget(keys) {
    const client = getRedis();
    if (!client) return mem.mget(keys);
    return client.mget(keys);
  },
  async del(keys) {
    const client = getRedis();
    const arr = Array.isArray(keys) ? keys : [keys];
    if (!client) {
      let n = 0;
      for (const k of arr) {
        if (memory.delete(k)) n++;
        if (memLists.delete(k)) n++;
        if (memSets.delete(k)) n++;
        if (memZSets.delete(k)) n++;
        expirations.delete(k);
      }
      return n;
    }
    return client.del(...arr);
  },
  async hmget(key, fields) {
    const client = getRedis();
    if (!client) return mem.hmget(key, fields);
    return client.hmget(key, ...fields);
  },
  async hgetall(key) {
    const client = getRedis();
    if (!client) return mem.hgetall(key);
    return client.hgetall(key);
  },
  async hset(key, field, value) {
    const client = getRedis();
    if (!client) return mem.hset(key, field, value);
    return client.hset(key, field, value);
  },
  async hget(key, field) {
    const client = getRedis();
    if (!client) {
      const obj = mem.hgetall(key) || {};
      return obj[field] ?? null;
    }
    return client.hget(key, field);
  },
  async hincrby(key, field, increment = 1) {
    const client = getRedis();
    if (!client) {
      const cur = parseInt(await kv.hget(key, field) || '0');
      const next = cur + increment;
      await kv.hset(key, field, String(next));
      return next;
    }
    return client.hincrby(key, field, increment);
  },
  async incr(key) {
    const client = getRedis();
    if (!client) {
      const cur = parseInt(mem.get(key) || '0');
      const next = cur + 1;
      memory.set(key, { value: String(next), expiresAt: null });
      return next;
    }
    return client.incr(key);
  },
  async incrby(key, increment = 1) {
    const client = getRedis();
    if (!client) {
      const cur = parseInt(mem.get(key) || '0');
      const next = cur + increment;
      memory.set(key, { value: String(next), expiresAt: null });
      return next;
    }
    return client.incrby(key, increment);
  },
  async expire(key, ttlSeconds) {
    const client = getRedis();
    if (!client) {
      const rec = memory.get(key);
      if (rec) rec.expiresAt = Date.now() + ttlSeconds * 1000;
      if (!rec) expirations.set(key, Date.now() + ttlSeconds * 1000);
      return 1;
    }
    return client.expire(key, ttlSeconds);
  },
  async lpush(key, value) {
    const client = getRedis();
    if (!client) {
      touchExpireForKey(key);
      const arr = memLists.get(key) || [];
      arr.unshift(value);
      memLists.set(key, arr);
      return arr.length;
    }
    return client.lpush(key, value);
  },
  async ltrim(key, start, end) {
    const client = getRedis();
    if (!client) {
      touchExpireForKey(key);
      const arr = memLists.get(key) || [];
      const trimmed = arr.slice(start, end + 1);
      memLists.set(key, trimmed);
      return 'OK';
    }
    return client.ltrim(key, start, end);
  },
  async lrange(key, start, end) {
    const client = getRedis();
    if (!client) {
      if (touchExpireForKey(key)) return [];
      const arr = memLists.get(key) || [];
      return arr.slice(start, end + 1);
    }
    return client.lrange(key, start, end);
  },
  async ttl(key) {
    const client = getRedis();
    if (!client) {
      const rec = memory.get(key);
      const exp = expirations.get(key);
      if (!rec && !memLists.has(key) && !memSets.has(key) && !memZSets.has(key)) return -2;
      const ts = (rec && rec.expiresAt) || exp || null;
      if (!ts) return -1;
      return Math.ceil((ts - Date.now()) / 1000);
    }
    return client.ttl(key);
  },
  async scan(pattern = '*', count = 1000) {
    const client = getRedis();
    if (!client) {
      const regex = new RegExp('^' + pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
      const keys = [];
      const addKey = (k) => { if (!touchExpireForKey(k) && regex.test(k)) keys.push(k); };
      for (const k of memory.keys()) { addKey(k); if (keys.length >= count) break; }
      for (const k of memLists.keys()) { addKey(k); if (keys.length >= count) break; }
      for (const k of memSets.keys()) { addKey(k); if (keys.length >= count) break; }
      for (const k of memZSets.keys()) { addKey(k); if (keys.length >= count) break; }
      return keys;
    }
    let cursor = '0';
    const keys = [];
    do {
      // eslint-disable-next-line no-await-in-loop
      const res = await client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
      cursor = res[0];
      keys.push(...res[1]);
      if (keys.length >= count) break;
    } while (cursor !== '0');
    return keys;
  }
};

// === Set operations ===
kv.sadd = async (key, ...members) => {
  const client = getRedis();
  if (!client) {
    touchExpireForKey(key);
    const set = memSets.get(key) || new Set();
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) { set.add(m); added++; }
    }
    memSets.set(key, set);
    return added;
  }
  return client.sadd(key, ...members);
};

kv.smembers = async (key) => {
  const client = getRedis();
  if (!client) {
    if (touchExpireForKey(key)) return [];
    const set = memSets.get(key) || new Set();
    return Array.from(set);
  }
  return client.smembers(key);
};

// === Sorted Set operations ===
kv.zadd = async (key, score, member) => {
  const client = getRedis();
  if (!client) {
    touchExpireForKey(key);
    const z = memZSets.get(key) || new Map();
    const isNew = z.has(member) ? 0 : 1;
    z.set(member, Number(score));
    memZSets.set(key, z);
    return isNew;
  }
  return client.zadd(key, score, member);
};

kv.zrem = async (key, member) => {
  const client = getRedis();
  if (!client) {
    if (touchExpireForKey(key)) return 0;
    const z = memZSets.get(key) || new Map();
    const existed = z.delete(member) ? 1 : 0;
    if (z.size === 0) memZSets.delete(key);
    return existed;
  }
  return client.zrem(key, member);
};

kv.zrevrange = async (key, start, stop, withScoresFlag) => {
  const client = getRedis();
  if (!client) {
    if (touchExpireForKey(key)) return [];
    const z = memZSets.get(key) || new Map();
    const arr = Array.from(z.entries()).sort((a, b) => b[1] - a[1]);
    const sliced = arr.slice(start, stop + 1);
    if (withScoresFlag === 'WITHSCORES') {
      const flat = [];
      for (const [m, s] of sliced) flat.push(m, String(s));
      return flat;
    }
    return sliced.map(([m]) => m);
  }
  return withScoresFlag ? client.zrevrange(key, start, stop, withScoresFlag) : client.zrevrange(key, start, stop);
};

kv.zincrby = async (key, increment, member) => {
  const client = getRedis();
  const inc = Number(increment);
  if (!client) {
    touchExpireForKey(key);
    const z = memZSets.get(key) || new Map();
    const cur = z.get(member) || 0;
    const next = cur + inc;
    z.set(member, next);
    memZSets.set(key, z);
    return String(next);
  }
  return client.zincrby(key, inc, member);
};

kv.zscore = async (key, member) => {
  const client = getRedis();
  if (!client) {
    if (touchExpireForKey(key)) return null;
    const z = memZSets.get(key) || new Map();
    const score = z.get(member);
    return score == null ? null : String(score);
  }
  return client.zscore(key, member);
};

// Simple pipeline wrapper
kv.pipeline = () => {
  const client = getRedis();
  if (client && typeof client.pipeline === 'function') {
    const p = client.pipeline();
    const wrap = {
      setex: (k, t, v) => { p.setex(k, t, v); return wrap; },
      set: (k, v) => { p.set(k, v); return wrap; },
      del: (...keys) => { const arr = Array.isArray(keys[0]) ? keys[0] : keys; p.del(...arr); return wrap; },
      expire: (k, t) => { p.expire(k, t); return wrap; },
      ttl: (k) => { p.ttl(k); return wrap; },
      sadd: (k, ...m) => { p.sadd(k, ...m); return wrap; },
      zadd: (k, s, m) => { p.zadd(k, s, m); return wrap; },
      zrem: (k, m) => { p.zrem(k, m); return wrap; },
      zincrby: (k, inc, m) => { p.zincrby(k, inc, m); return wrap; },
      lpush: (k, v) => { p.lpush(k, v); return wrap; },
      ltrim: (k, s, e) => { p.ltrim(k, s, e); return wrap; },
      hset: (k, f, v) => { p.hset(k, f, v); return wrap; },
      hincrby: (k, f, inc) => { p.hincrby(k, f, inc); return wrap; },
      incr: (k) => { p.incr(k); return wrap; },
      incrby: (k, inc) => { p.incrby(k, inc); return wrap; },
      exec: async () => p.exec(),
    };
    return wrap;
  }
  // memory fallback pipeline
  const ops = [];
  const add = (fn) => { ops.push(fn); return api; };
  const api = {
    setex: (k, t, v) => add(() => kv.setex(k, t, v)),
    set: (k, v) => add(() => kv.set(k, v)),
    del: (...keys) => {
      const arr = Array.isArray(keys[0]) ? keys[0] : keys; return add(() => kv.del(arr));
    },
    expire: (k, t) => add(() => kv.expire(k, t)),
    sadd: (k, ...m) => add(() => kv.sadd(k, ...m)),
    zadd: (k, s, m) => add(() => kv.zadd(k, s, m)),
    zrem: (k, m) => add(() => kv.zrem(k, m)),
    zincrby: (k, inc, m) => add(() => kv.zincrby(k, inc, m)),
    lpush: (k, v) => add(() => kv.lpush(k, v)),
    ltrim: (k, s, e) => add(() => kv.ltrim(k, s, e)),
    hset: (k, f, v) => add(() => kv.hset(k, f, v)),
    ttl: (k) => add(() => kv.ttl(k)),
    hincrby: (k, f, inc) => add(() => kv.hincrby(k, f, inc)),
    incr: (k) => add(() => kv.incr(k)),
    incrby: (k, inc) => add(() => kv.incrby(k, inc)),
    exec: async () => {
      const res = [];
      for (const fn of ops) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const r = await fn();
          res.push([null, r]);
        } catch (e) {
          res.push([e, null]);
        }
      }
      return res;
    }
  };
  return api;
};

// msetex utility: entries: [{ key, ttl, value }]
kv.msetex = async (entries = []) => {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const p = kv.pipeline();
  for (const { key, ttl, value } of entries) {
    p.setex(key, ttl, typeof value === 'string' ? value : JSON.stringify(value));
  }
  return p.exec();
};

// Delete by pattern(s): scans then deletes matching keys.
kv.mdelPattern = async (patterns, count = 10000) => {
  const pats = Array.isArray(patterns) ? patterns : [patterns];
  let total = 0;
  for (const pat of pats) {
    const keys = await kv.scan(pat, count);
    if (keys.length) {
      await kv.del(keys);
      total += keys.length;
    }
  }
  return total;
};

// Named export 추가 (호환성)
export { kv };

// Default export 유지 (기존 코드 호환)
export default kv;
