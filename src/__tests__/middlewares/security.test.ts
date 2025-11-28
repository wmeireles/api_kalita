import { Request, Response, NextFunction } from 'express';
import {
  attackDetection,
  bodySize,
  validateContentType,
} from '../../middlewares/security';

describe('Security Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      url: '/test',
      body: {},
      query: {},
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('Attack Detection', () => {
    it('should detect XSS in URL', () => {
      mockReq.url = '/test?q=<script>alert(1)</script>';

      attackDetection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Requisição inválida detectada',
        },
      });
    });

    it('should detect SQL injection in body', () => {
      mockReq.body = {
        query: 'SELECT * FROM users; DROP TABLE users;',
      };

      attackDetection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Dados maliciosos detectados',
        },
      });
    });

    it('should allow safe requests', () => {
      mockReq.url = '/test?q=normal-query';
      mockReq.body = { name: 'John Doe', email: 'john@example.com' };

      attackDetection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Body Size Validation', () => {
    it('should reject oversized payload', () => {
      mockReq.headers!['content-length'] = '2097152'; // 2MB
      const middleware = bodySize('1mb');

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(413);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 413,
          message: 'Payload muito grande. Máximo: 1mb',
        },
      });
    });

    it('should allow valid payload size', () => {
      mockReq.headers!['content-length'] = '512000'; // 500KB
      const middleware = bodySize('1mb');

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Content Type Validation', () => {
    it('should reject invalid content type', () => {
      mockReq.headers!['content-type'] = 'text/plain';
      const middleware = validateContentType(['application/json']);

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(415);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 415,
          message: 'Content-Type não suportado. Permitidos: application/json',
        },
      });
    });

    it('should allow valid content type', () => {
      mockReq.headers!['content-type'] = 'application/json';
      const middleware = validateContentType(['application/json']);

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
