// Centralized CORS configuration
import cors from 'cors';

export function getAllowedOrigins() {
  const fromEnv = process.env.ALLOWED_ORIGINS;
  if (fromEnv && typeof fromEnv === 'string') {
    return fromEnv.split(',').map(s => s.trim()).filter(Boolean);
  }

  // Sensible defaults for local dev
  const localhostPorts = [3000,3001,3002,3003,3004,3005,3006,4000,5000,5001,5002,8081];
  const hosts = ['http://localhost', 'http://127.0.0.1'];
  const origins = [];
  for (const host of hosts) {
    for (const port of localhostPorts) {
      origins.push(`${host}:${port}`);
    }
  }
  return origins;
}

export function buildCorsOptions() {
  const allowed = new Set(getAllowedOrigins());
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    origin(origin, cb) {
      if (!origin) return cb(null, true); // mobile/curl
      if (allowed.has(origin) || isDev) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: [
      'Content-Type','Authorization','Accept-Language','X-Language','x-language',
      'X-Currency','X-Timezone','X-Client-Type','X-Platform','x-platform',
      'X-Client-Version','x-client-version','X-Request-ID','x-apollo-operation-name',
      'x-apollo-cache-do-not-cache','Apollo-Require-Preflight','Access-Control-Request-Headers',
      'Access-Control-Request-Method'
    ],
    optionsSuccessStatus: 200,
  };
}

// Socket.IO helper (array origin only)
export function buildSocketCors() {
  const allowed = getAllowedOrigins();
  return {
    origin: allowed,
    methods: ['GET','POST'],
    credentials: true,
    allowedHeaders: ['Content-Type','Authorization']
  };
}

export function withCors(app) {
  const opts = buildCorsOptions();
  app.use(cors(opts));
  return opts;
}

export default { getAllowedOrigins, buildCorsOptions, buildSocketCors, withCors };

