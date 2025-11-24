import { Request, Response, NextFunction } from 'express';
import { createFileValidator, handleMulterError } from '../../middlewares/fileValidation';

// Mock do multer
jest.mock('multer', () => {
  const mockMulter = {
    memoryStorage: jest.fn(() => ({})),
    MulterError: class MulterError extends Error {
      code: string;
      constructor(code: string, message?: string) {
        super(message);
        this.code = code;
        this.name = 'MulterError';
      }
    },
  };
  
  const multerInstance = jest.fn(() => ({
    single: jest.fn(() => (req: any, res: any, next: any) => next()),
    array: jest.fn(() => (req: any, res: any, next: any) => next()),
  }));
  
  return Object.assign(multerInstance, mockMulter);
});

const multer = require('multer');

describe('File Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createFileValidator - single file', () => {
    it('deve passar quando arquivo não é obrigatório e não foi enviado', () => {
      const validator = createFileValidator({ required: false });
      const [, validationMiddleware] = validator.single('photo');

      mockRequest.file = undefined;

      validationMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('deve falhar quando arquivo é obrigatório e não foi enviado', () => {
      const validator = createFileValidator({ required: true });
      const [, validationMiddleware] = validator.single('photo');

      mockRequest.file = undefined;

      validationMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Arquivo é obrigatório',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve falhar quando arquivo excede tamanho máximo', () => {
      const validator = createFileValidator({ 
        maxSize: 1024, // 1KB
        required: false 
      });
      const [, validationMiddleware] = validator.single('photo');

      mockRequest.file = {
        fieldname: 'photo',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 2048, // 2KB
        buffer: Buffer.alloc(2048),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      validationMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Arquivo muito grande. Máximo: 0.0MB',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve passar quando arquivo é válido', () => {
      const validator = createFileValidator({ 
        maxSize: 5 * 1024 * 1024, // 5MB
        required: false 
      });
      const [, validationMiddleware] = validator.single('photo');

      mockRequest.file = {
        fieldname: 'photo',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024, // 1KB
        buffer: Buffer.alloc(1024),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      validationMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('createFileValidator - multiple files', () => {
    it('deve falhar quando arquivos são obrigatórios e não foram enviados', () => {
      const validator = createFileValidator({ required: true });
      const [, validationMiddleware] = validator.multiple('photos');

      mockRequest.files = [];

      validationMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Pelo menos um arquivo é obrigatório',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve falhar quando excede número máximo de arquivos', () => {
      const validator = createFileValidator({ 
        maxFiles: 2,
        required: false 
      });
      const [, validationMiddleware] = validator.multiple('photos');

      mockRequest.files = [
        { size: 1024, originalname: 'file1.jpg' },
        { size: 1024, originalname: 'file2.jpg' },
        { size: 1024, originalname: 'file3.jpg' },
      ] as Express.Multer.File[];

      validationMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Muitos arquivos. Máximo: 2',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve falhar quando um arquivo excede tamanho máximo', () => {
      const validator = createFileValidator({ 
        maxSize: 1024, // 1KB
        required: false 
      });
      const [, validationMiddleware] = validator.multiple('photos');

      mockRequest.files = [
        { 
          size: 512, 
          originalname: 'small.jpg',
          fieldname: 'photos',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.alloc(512),
          destination: '',
          filename: '',
          path: '',
          stream: null as any,
        },
        { 
          size: 2048, 
          originalname: 'large.jpg',
          fieldname: 'photos',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.alloc(2048),
          destination: '',
          filename: '',
          path: '',
          stream: null as any,
        },
      ] as Express.Multer.File[];

      validationMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Arquivo "large.jpg" muito grande. Máximo: 0.0MB',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve passar quando arquivos são válidos', () => {
      const validator = createFileValidator({ 
        maxSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
        required: false 
      });
      const [, validationMiddleware] = validator.multiple('photos');

      mockRequest.files = [
        { 
          size: 1024, 
          originalname: 'file1.jpg',
          fieldname: 'photos',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.alloc(1024),
          destination: '',
          filename: '',
          path: '',
          stream: null as any,
        },
        { 
          size: 2048, 
          originalname: 'file2.jpg',
          fieldname: 'photos',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.alloc(2048),
          destination: '',
          filename: '',
          path: '',
          stream: null as any,
        },
      ] as Express.Multer.File[];

      validationMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('handleMulterError', () => {
    it('deve tratar erro LIMIT_FILE_SIZE', () => {
      const error = new multer.MulterError('LIMIT_FILE_SIZE');

      handleMulterError(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Arquivo muito grande',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve tratar erro LIMIT_FILE_COUNT', () => {
      const error = new multer.MulterError('LIMIT_FILE_COUNT');

      handleMulterError(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Muitos arquivos enviados',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve tratar erro de tipo de arquivo inválido', () => {
      const error = new Error('Tipo de arquivo não permitido');
      (error as any).code = 'INVALID_FILE_TYPE';

      handleMulterError(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 400,
          message: 'Tipo de arquivo não permitido',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve passar erro desconhecido para próximo middleware', () => {
      const error = new Error('Erro desconhecido');

      handleMulterError(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});