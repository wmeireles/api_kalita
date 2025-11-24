import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { corsOptions, adminCorsOptions, publicCorsOptions } from './cors';

// Middleware para aplicar CORS dinâmico baseado na rota
export const dynamicCors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.path;

  // Rotas administrativas
  if (path.startsWith('/api/v1/admin') || path.startsWith('/api/v1/auth')) {
    return cors(adminCorsOptions)(req, res, next);
  }

  // Rotas de upload (requer autenticação)
  if (path.startsWith('/api/v1/upload')) {
    return cors(corsOptions)(req, res, next);
  }

  // Rotas públicas (formulários, galeria, etc.)
  if (
    path.startsWith('/api/v1/service-form') ||
    path.startsWith('/api/v1/public')
  ) {
    return cors(publicCorsOptions)(req, res, next);
  }

  // Rotas de sistema (health, docs)
  if (path === '/health' || path.startsWith('/api-docs')) {
    return cors(publicCorsOptions)(req, res, next);
  }

  // Padrão para outras rotas
  return cors(corsOptions)(req, res, next);
};

// Middleware específico para rotas administrativas
export const adminCors = cors(adminCorsOptions);

// Middleware específico para rotas públicas
export const publicCors = cors(publicCorsOptions);

// Middleware padrão
export const defaultCors = cors(corsOptions);
