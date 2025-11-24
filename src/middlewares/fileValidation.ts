import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';

export interface FileValidationOptions {
  allowedTypes?: string[];
  maxSize?: number; // em bytes
  maxFiles?: number;
  required?: boolean;
}

const DEFAULT_OPTIONS: FileValidationOptions = {
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 10,
  required: false,
};

// Configuração do multer para memória
const storage = multer.memoryStorage();

export const createFileValidator = (options: FileValidationOptions = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options };

  const upload = multer({
    storage,
    limits: {
      fileSize: config.maxSize,
      files: config.maxFiles,
    },
    fileFilter: (req, file, cb) => {
      // Validar tipo de arquivo
      if (!config.allowedTypes?.includes(file.mimetype)) {
        const error = new Error(`Tipo de arquivo não permitido: ${file.mimetype}`);
        (error as any).code = 'INVALID_FILE_TYPE';
        return cb(error);
      }

      // Validar extensão
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const fileExtension = path.extname(file.originalname).toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        const error = new Error(`Extensão de arquivo não permitida: ${fileExtension}`);
        (error as any).code = 'INVALID_FILE_EXTENSION';
        return cb(error);
      }

      cb(null, true);
    },
  });

  return {
    single: (fieldName: string) => [
      upload.single(fieldName),
      (req: Request, res: Response, next: NextFunction) => {
        try {
          // Verificar se arquivo é obrigatório
          if (config.required && !req.file) {
            return res.status(400).json({
              success: false,
              error: {
                code: 400,
                message: 'Arquivo é obrigatório',
              },
            });
          }

          // Validações adicionais se arquivo existe
          if (req.file) {
            // Validar tamanho
            if (req.file.size > config.maxSize!) {
              return res.status(400).json({
                success: false,
                error: {
                  code: 400,
                  message: `Arquivo muito grande. Máximo: ${(config.maxSize! / 1024 / 1024).toFixed(1)}MB`,
                },
              });
            }
          }

          next();
        } catch (error) {
          console.error('Erro na validação de arquivo:', error);
          res.status(500).json({
            success: false,
            error: {
              code: 500,
              message: 'Erro interno do servidor',
            },
          });
        }
      },
    ],

    multiple: (fieldName: string) => [
      upload.array(fieldName, config.maxFiles),
      (req: Request, res: Response, next: NextFunction) => {
        try {
          const files = req.files as Express.Multer.File[];

          // Verificar se arquivos são obrigatórios
          if (config.required && (!files || files.length === 0)) {
            return res.status(400).json({
              success: false,
              error: {
                code: 400,
                message: 'Pelo menos um arquivo é obrigatório',
              },
            });
          }

          // Validações adicionais se arquivos existem
          if (files && files.length > 0) {
            // Validar quantidade
            if (files.length > config.maxFiles!) {
              return res.status(400).json({
                success: false,
                error: {
                  code: 400,
                  message: `Muitos arquivos. Máximo: ${config.maxFiles}`,
                },
              });
            }

            // Validar tamanho de cada arquivo
            for (const file of files) {
              if (file.size > config.maxSize!) {
                return res.status(400).json({
                  success: false,
                  error: {
                    code: 400,
                    message: `Arquivo "${file.originalname}" muito grande. Máximo: ${(config.maxSize! / 1024 / 1024).toFixed(1)}MB`,
                  },
                });
              }
            }

            // Validar tamanho total
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            const maxTotalSize = config.maxSize! * config.maxFiles!;
            
            if (totalSize > maxTotalSize) {
              return res.status(400).json({
                success: false,
                error: {
                  code: 400,
                  message: `Tamanho total dos arquivos muito grande. Máximo: ${(maxTotalSize / 1024 / 1024).toFixed(1)}MB`,
                },
              });
            }
          }

          next();
        } catch (error) {
          console.error('Erro na validação de arquivos:', error);
          res.status(500).json({
            success: false,
            error: {
              code: 500,
              message: 'Erro interno do servidor',
            },
          });
        }
      },
    ],
  };
};

// Middleware para tratar erros do multer
export const handleMulterError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Arquivo muito grande',
          },
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Muitos arquivos enviados',
          },
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Campo de arquivo inesperado',
          },
        });
      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Erro no upload do arquivo',
          },
        });
    }
  }

  if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: error.message,
      },
    });
  }

  if (error.code === 'INVALID_FILE_EXTENSION') {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: error.message,
      },
    });
  }

  next(error);
};

// Presets comuns
export const imageValidator = createFileValidator({
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 10,
});

export const portfolioValidator = createFileValidator({
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 20,
});

export const avatarValidator = createFileValidator({
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
  maxSize: 2 * 1024 * 1024, // 2MB
  maxFiles: 1,
  required: true,
});