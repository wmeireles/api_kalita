import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';

// Tipos de permissões
export enum Permission {
  // Portfolio
  PORTFOLIO_READ = 'portfolio:read',
  PORTFOLIO_CREATE = 'portfolio:create',
  PORTFOLIO_UPDATE = 'portfolio:update',
  PORTFOLIO_DELETE = 'portfolio:delete',
  PORTFOLIO_BULK = 'portfolio:bulk',

  // Categorias
  CATEGORY_READ = 'category:read',
  CATEGORY_CREATE = 'category:create',
  CATEGORY_UPDATE = 'category:update',
  CATEGORY_DELETE = 'category:delete',

  // Upload
  UPLOAD_SINGLE = 'upload:single',
  UPLOAD_MULTIPLE = 'upload:multiple',
  UPLOAD_DELETE = 'upload:delete',

  // Admin
  ADMIN_FULL = 'admin:full',
}

// Roles e suas permissões
export enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  PUBLIC = 'public',
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.PORTFOLIO_READ,
    Permission.PORTFOLIO_CREATE,
    Permission.PORTFOLIO_UPDATE,
    Permission.PORTFOLIO_DELETE,
    Permission.PORTFOLIO_BULK,
    Permission.CATEGORY_READ,
    Permission.CATEGORY_CREATE,
    Permission.CATEGORY_UPDATE,
    Permission.CATEGORY_DELETE,
    Permission.UPLOAD_SINGLE,
    Permission.UPLOAD_MULTIPLE,
    Permission.UPLOAD_DELETE,
    Permission.ADMIN_FULL,
  ],
  [Role.EDITOR]: [
    Permission.PORTFOLIO_READ,
    Permission.PORTFOLIO_CREATE,
    Permission.PORTFOLIO_UPDATE,
    Permission.CATEGORY_READ,
    Permission.CATEGORY_CREATE,
    Permission.CATEGORY_UPDATE,
    Permission.UPLOAD_SINGLE,
    Permission.UPLOAD_MULTIPLE,
  ],
  [Role.VIEWER]: [Permission.PORTFOLIO_READ, Permission.CATEGORY_READ],
  [Role.PUBLIC]: [Permission.PORTFOLIO_READ, Permission.CATEGORY_READ],
};

// Interface para usuário autenticado
interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  permissions: Permission[];
}

// Estender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware de autenticação JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const adminToken = req.headers['x-admin-token'] as string;

    let token: string | undefined;

    // Verificar token no header Authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    // Verificar token administrativo
    else if (adminToken) {
      token = adminToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'Token de acesso requerido',
        },
      });
    }

    // Verificar JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const user: AuthenticatedUser = {
      id: payload.sub as string,
      email: payload.email as string,
      role: (payload.role as Role) || Role.PUBLIC,
      permissions: ROLE_PERMISSIONS[(payload.role as Role) || Role.PUBLIC],
    };

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({
      success: false,
      error: {
        code: 401,
        message: 'Token inválido ou expirado',
      },
    });
  }
};

/**
 * Middleware de autorização por permissões
 */
export const authorize = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'Usuário não autenticado',
        },
      });
    }

    const userPermissions = req.user.permissions;
    const hasPermission = requiredPermissions.some(
      (permission) =>
        userPermissions.includes(permission) ||
        userPermissions.includes(Permission.ADMIN_FULL)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 403,
          message: 'Permissão insuficiente para esta operação',
          required: requiredPermissions,
          current: userPermissions,
        },
      });
    }

    next();
  };
};

/**
 * Middleware de autorização por role
 */
export const authorizeRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 401,
          message: 'Usuário não autenticado',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 403,
          message: 'Role insuficiente para esta operação',
          required: allowedRoles,
          current: req.user.role,
        },
      });
    }

    next();
  };
};

/**
 * Middleware para rotas administrativas
 */
export const requireAdmin = [authenticate, authorizeRole(Role.ADMIN)];

/**
 * Middleware para operações de portfólio
 */
export const portfolioPermissions = {
  read: [authenticate, authorize(Permission.PORTFOLIO_READ)],
  create: [authenticate, authorize(Permission.PORTFOLIO_CREATE)],
  update: [authenticate, authorize(Permission.PORTFOLIO_UPDATE)],
  delete: [authenticate, authorize(Permission.PORTFOLIO_DELETE)],
  bulk: [authenticate, authorize(Permission.PORTFOLIO_BULK)],
};

/**
 * Middleware para operações de categoria
 */
export const categoryPermissions = {
  read: [authenticate, authorize(Permission.CATEGORY_READ)],
  create: [authenticate, authorize(Permission.CATEGORY_CREATE)],
  update: [authenticate, authorize(Permission.CATEGORY_UPDATE)],
  delete: [authenticate, authorize(Permission.CATEGORY_DELETE)],
};

/**
 * Middleware para operações de upload
 */
export const uploadPermissions = {
  single: [authenticate, authorize(Permission.UPLOAD_SINGLE)],
  multiple: [authenticate, authorize(Permission.UPLOAD_MULTIPLE)],
  delete: [authenticate, authorize(Permission.UPLOAD_DELETE)],
};

/**
 * Middleware opcional de autenticação (não falha se não autenticado)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      req.user = {
        id: payload.sub as string,
        email: payload.email as string,
        role: (payload.role as Role) || Role.PUBLIC,
        permissions: ROLE_PERMISSIONS[(payload.role as Role) || Role.PUBLIC],
      };
    }
  } catch (error) {
    // Ignorar erros de autenticação opcional
    console.warn('Autenticação opcional falhou:', error);
  }

  next();
};

// Utilitários
export const hasPermission = (
  user: AuthenticatedUser,
  permission: Permission
): boolean => {
  return (
    user.permissions.includes(permission) ||
    user.permissions.includes(Permission.ADMIN_FULL)
  );
};

export const hasRole = (user: AuthenticatedUser, role: Role): boolean => {
  return user.role === role;
};

export const isAdmin = (user: AuthenticatedUser): boolean => {
  return user.role === Role.ADMIN;
};
