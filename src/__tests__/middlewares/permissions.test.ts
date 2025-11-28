import { Request, Response, NextFunction } from 'express';
import { authorize, Permission, Role } from '../../middlewares/permissions';

interface MockRequest extends Partial<Request> {
  user?: {
    id: string;
    email: string;
    role: Role;
    permissions: Permission[];
  };
}

describe('Authorization Middleware', () => {
  let mockReq: MockRequest;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should reject unauthenticated user', () => {
    const middleware = authorize(Permission.PORTFOLIO_CREATE);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 401,
        message: 'Usuário não autenticado',
      },
    });
  });

  it('should allow user with required permission', () => {
    mockReq.user = {
      id: 'user123',
      email: 'test@example.com',
      role: Role.ADMIN,
      permissions: [Permission.PORTFOLIO_CREATE, Permission.ADMIN_FULL],
    };

    const middleware = authorize(Permission.PORTFOLIO_CREATE);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should allow admin with ADMIN_FULL permission', () => {
    mockReq.user = {
      id: 'admin123',
      email: 'admin@example.com',
      role: Role.ADMIN,
      permissions: [Permission.ADMIN_FULL],
    };

    const middleware = authorize(Permission.PORTFOLIO_DELETE);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject user without required permission', () => {
    mockReq.user = {
      id: 'user123',
      email: 'test@example.com',
      role: Role.VIEWER,
      permissions: [Permission.PORTFOLIO_READ],
    };

    const middleware = authorize(Permission.PORTFOLIO_CREATE);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 403,
        message: 'Permissão insuficiente para esta operação',
        required: [Permission.PORTFOLIO_CREATE],
        current: [Permission.PORTFOLIO_READ],
      },
    });
  });

  it('should handle multiple required permissions', () => {
    mockReq.user = {
      id: 'user123',
      email: 'test@example.com',
      role: Role.EDITOR,
      permissions: [Permission.PORTFOLIO_READ, Permission.PORTFOLIO_CREATE],
    };

    const middleware = authorize(
      Permission.PORTFOLIO_CREATE,
      Permission.PORTFOLIO_UPDATE
    );
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
