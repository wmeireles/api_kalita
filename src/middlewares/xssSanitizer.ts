import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import validator from 'validator';

// Configurar DOMPurify para Node.js
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripTags?: boolean;
}

const DEFAULT_OPTIONS: SanitizeOptions = {
  allowedTags: [],
  allowedAttributes: [],
  stripTags: true,
};

/**
 * Sanitiza recursivamente um objeto removendo scripts maliciosos
 */
const sanitizeObject = (obj: any, options: SanitizeOptions): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj, options);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, options));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitizar também as chaves
      const sanitizedKey = sanitizeString(key, options);
      sanitized[sanitizedKey] = sanitizeObject(value, options);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Sanitiza uma string removendo XSS
 */
const sanitizeString = (str: string, options: SanitizeOptions): string => {
  if (!str || typeof str !== 'string') {
    return str;
  }

  // Configurar DOMPurify
  const config: any = {
    ALLOWED_TAGS: options.allowedTags || [],
    ALLOWED_ATTR: options.allowedAttributes || [],
    KEEP_CONTENT: !options.stripTags,
  };

  // Sanitizar HTML/scripts maliciosos
  let sanitized = String(purify.sanitize(str, config));

  // Escapar caracteres especiais adicionais
  sanitized = validator.escape(sanitized);

  // Remover sequências de escape JavaScript
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );

  return sanitized;
};

/**
 * Middleware de sanitização XSS
 */
export const xssSanitizer = (options: SanitizeOptions = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitizar body
      if (req.body) {
        req.body = sanitizeObject(req.body, config);
      }

      // Sanitizar query parameters
      if (req.query) {
        req.query = sanitizeObject(req.query, config);
      }

      // Sanitizar params
      if (req.params) {
        req.params = sanitizeObject(req.params, config);
      }

      // Sanitizar headers específicos (se necessário)
      const headersToSanitize = ['x-forwarded-for', 'user-agent', 'referer'];
      headersToSanitize.forEach((header) => {
        if (req.headers[header]) {
          req.headers[header] = sanitizeString(
            req.headers[header] as string,
            config
          );
        }
      });

      next();
    } catch (error) {
      console.error('Erro na sanitização XSS:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: 'Dados inválidos detectados',
        },
      });
    }
  };
};

/**
 * Middleware específico para formulários (mais permissivo)
 */
export const formSanitizer = xssSanitizer({
  allowedTags: ['b', 'i', 'em', 'strong', 'br'],
  allowedAttributes: [],
  stripTags: false,
});

/**
 * Middleware específico para dados administrativos (mais restritivo)
 */
export const adminSanitizer = xssSanitizer({
  allowedTags: [],
  allowedAttributes: [],
  stripTags: true,
});

/**
 * Middleware específico para uploads (muito restritivo)
 */
export const uploadSanitizer = xssSanitizer({
  allowedTags: [],
  allowedAttributes: [],
  stripTags: true,
});

// Utilitário para sanitização manual
export const sanitize = {
  string: (str: string, options?: SanitizeOptions) =>
    sanitizeString(str, { ...DEFAULT_OPTIONS, ...options }),

  object: (obj: any, options?: SanitizeOptions) =>
    sanitizeObject(obj, { ...DEFAULT_OPTIONS, ...options }),
};
