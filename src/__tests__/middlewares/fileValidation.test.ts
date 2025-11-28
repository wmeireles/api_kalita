import { Request, Response, NextFunction } from 'express';
import { handleMulterError } from '../../middlewares/fileValidation';
import multer from 'multer';

describe('File Validation Middleware', () => {
  let mockReq: Partial<Request>;
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

  describe('Multer Error Handler', () => {
    it('should handle file size limit error', () => {
      const error = new multer.MulterError('LIMIT_FILE_SIZE');
      handleMulterError(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Arquivo muito grande',
        },
      });
    });

    it('should handle file count limit error', () => {
      const error = new multer.MulterError('LIMIT_FILE_COUNT');
      handleMulterError(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Muitos arquivos enviados',
        },
      });
    });

    it('should handle unexpected file error', () => {
      const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
      handleMulterError(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Campo de arquivo inesperado',
        },
      });
    });

    it('should handle invalid file type error', () => {
      const error = {
        code: 'INVALID_FILE_TYPE',
        message: 'Tipo não permitido',
      };
      handleMulterError(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Tipo não permitido',
        },
      });
    });

    it('should handle invalid file extension error', () => {
      const error = {
        code: 'INVALID_FILE_EXTENSION',
        message: 'Extensão não permitida',
      };
      handleMulterError(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Extensão não permitida',
        },
      });
    });

    it('should pass through other errors', () => {
      const error = new Error('Other error');
      handleMulterError(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
