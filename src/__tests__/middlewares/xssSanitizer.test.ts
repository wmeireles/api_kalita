import { Request, Response, NextFunction } from 'express';

// Mock das dependências
jest.mock('dompurify');
jest.mock('jsdom');
jest.mock('validator', () => ({
  escape: jest.fn((str) => str.replace(/[&<>"']/g, '')),
}));

import { xssSanitizer } from '../../middlewares/xssSanitizer';

describe('XSS Sanitizer Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should sanitize body data', () => {
    mockReq.body = {
      name: '<script>alert("xss")</script>John',
      email: 'test@example.com',
    };

    const middleware = xssSanitizer();
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.body.name).not.toContain('<script>');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should sanitize query parameters', () => {
    mockReq.query = {
      search: '<img src=x onerror=alert(1)>',
    };

    const middleware = xssSanitizer();
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle null/undefined values', () => {
    mockReq.body = null;
    mockReq.query = undefined;

    const middleware = xssSanitizer();
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle errors gracefully', () => {
    // Simular erro
    Object.defineProperty(mockReq, 'body', {
      get: () => {
        throw new Error('Test error');
      },
    });

    const middleware = xssSanitizer();
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 400,
        message: 'Dados inválidos detectados',
      },
    });
  });
});
