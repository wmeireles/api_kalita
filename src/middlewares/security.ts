import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Configuração do Helmet para segurança HTTP
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Permite embeds de imagens
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Rate limiting para diferentes tipos de endpoints
 */
export const rateLimits = {
  // Rate limit geral
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: {
      success: false,
      error: {
        code: 429,
        message: 'Muitas requisições. Tente novamente em 15 minutos.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Rate limit para uploads
  upload: rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // 10 uploads por minuto
    message: {
      success: false,
      error: {
        code: 429,
        message: 'Limite de uploads excedido. Tente novamente em 1 minuto.',
      },
    },
  }),

  // Rate limit para formulários
  form: rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 5, // 5 submissões por minuto
    message: {
      success: false,
      error: {
        code: 429,
        message: 'Limite de formulários excedido. Tente novamente em 1 minuto.',
      },
    },
  }),

  // Rate limit para autenticação
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas de login por IP
    message: {
      success: false,
      error: {
        code: 429,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      },
    },
  }),

  // Rate limit para rotas administrativas
  admin: rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // 30 requests por minuto para admin
    message: {
      success: false,
      error: {
        code: 429,
        message: 'Limite administrativo excedido. Tente novamente em 1 minuto.',
      },
    },
  }),
};

/**
 * Middleware para validar tamanho do body
 */
export const bodySize = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];

    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);

      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          success: false,
          error: {
            code: 413,
            message: `Payload muito grande. Máximo: ${maxSize}`,
          },
        });
      }
    }

    next();
  };
};

/**
 * Middleware para validar Content-Type
 */
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];

    if (!contentType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: 'Content-Type é obrigatório',
        },
      });
    }

    const isAllowed = allowedTypes.some((type) =>
      contentType.toLowerCase().includes(type.toLowerCase())
    );

    if (!isAllowed) {
      return res.status(415).json({
        success: false,
        error: {
          code: 415,
          message: `Content-Type não suportado. Permitidos: ${allowedTypes.join(', ')}`,
        },
      });
    }

    next();
  };
};

/**
 * Middleware para log de segurança
 */
export const securityLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const securityInfo = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    referer: req.headers.referer,
  };

  // Log apenas em produção ou quando necessário
  if (process.env.NODE_ENV === 'production') {
    console.log('Security Log:', JSON.stringify(securityInfo));
  }

  next();
};

/**
 * Middleware para detectar tentativas de ataque
 */
export const attackDetection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const suspiciousPatterns = [
    /(<script|javascript:|on\w+\s*=)/i, // XSS
    /(union\s+select|drop\s+table|insert\s+into)/i, // SQL Injection
    /(\.\.\/|\.\.\\)/g, // Path Traversal
    /(\${|<%|<\?)/i, // Template Injection
  ];

  const checkString = (str: string): boolean => {
    return suspiciousPatterns.some((pattern) => pattern.test(str));
  };

  const checkObject = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return checkString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.some((item) => checkObject(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some((value) => checkObject(value));
    }

    return false;
  };

  // Verificar URL
  if (checkString(req.url)) {
    console.warn('Tentativa de ataque detectada na URL:', req.url);
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Requisição inválida detectada',
      },
    });
  }

  // Verificar body
  if (req.body && checkObject(req.body)) {
    console.warn('Tentativa de ataque detectada no body:', req.body);
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Dados maliciosos detectados',
      },
    });
  }

  // Verificar query parameters
  if (req.query && checkObject(req.query)) {
    console.warn('Tentativa de ataque detectada nos parâmetros:', req.query);
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: 'Parâmetros maliciosos detectados',
      },
    });
  }

  next();
};

// Utilitário para converter tamanho em string para bytes
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return Math.floor(value * (units[unit] || 1));
}

// Presets de segurança
export const securityPresets = {
  // Segurança básica para rotas públicas
  public: [
    securityHeaders,
    rateLimits.general,
    bodySize('1mb'),
    attackDetection,
  ],

  // Segurança para formulários
  form: [
    securityHeaders,
    rateLimits.form,
    bodySize('2mb'),
    validateContentType(['application/json']),
    attackDetection,
  ],

  // Segurança para uploads
  upload: [
    securityHeaders,
    rateLimits.upload,
    bodySize('50mb'),
    validateContentType(['multipart/form-data']),
    attackDetection,
  ],

  // Segurança para rotas administrativas
  admin: [
    securityHeaders,
    rateLimits.admin,
    bodySize('10mb'),
    securityLogger,
    attackDetection,
  ],
};
