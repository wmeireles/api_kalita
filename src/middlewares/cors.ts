import { CorsOptions } from 'cors';

// Domínios públicos (acesso geral)
const publicOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://kalita-fotografia.com',
  'https://www.kalita-fotografia.com',
  process.env.PUBLIC_DOMAIN,
].filter(Boolean);

// Domínios administrativos (acesso restrito)
const adminOrigins = [
  'http://localhost:3001',
  'http://localhost:5174',
  'https://admin.kalita-fotografia.com',
  'https://dashboard.kalita-fotografia.com',
  process.env.ADMIN_DOMAIN,
].filter(Boolean);

// Todos os domínios permitidos
const allowedOrigins = [...publicOrigins, ...adminOrigins];

// Verificar se origem é administrativa
const isAdminOrigin = (origin: string): boolean => {
  return adminOrigins.includes(origin);
};

// Verificar se origem é pública
const isPublicOrigin = (origin: string): boolean => {
  return publicOrigins.includes(origin);
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Permitir tudo em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Verificar se origem está na lista permitida
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Rejeitar origem não permitida
    const errorMsg = `Origem '${origin}' não permitida pelo CORS`;
    return callback(new Error(errorMsg), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Admin-Token',
    'X-API-Key',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 horas
};

// CORS específico para rotas administrativas
export const adminCorsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, false); // Mais restritivo para admin
    }

    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Apenas domínios administrativos
    if (isAdminOrigin(origin)) {
      return callback(null, true);
    }

    const errorMsg = `Acesso administrativo negado para origem '${origin}'`;
    return callback(new Error(errorMsg), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Admin-Token',
    'X-API-Key',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 3600, // 1 hora (mais restritivo)
};

// CORS específico para rotas públicas
export const publicCorsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Permitir domínios públicos e administrativos
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const errorMsg = `Origem '${origin}' não permitida`;
    return callback(new Error(errorMsg), false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Origin'],
  credentials: false, // Menos restritivo para público
  optionsSuccessStatus: 200,
  maxAge: 86400,
};

// Utilitários para verificação de origem
export { isAdminOrigin, isPublicOrigin, publicOrigins, adminOrigins };
