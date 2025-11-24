import { Router, Request, Response } from 'express';
import { 
  imageValidator, 
  portfolioValidator, 
  avatarValidator, 
  handleMulterError 
} from '../../middlewares/fileValidation';
import { authenticateToken, requireAdmin } from '../../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /api/v1/upload/portfolio:
 *   post:
 *     summary: Upload de imagens do portfólio (Admin)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 20
 *     responses:
 *       200:
 *         description: Upload realizado com sucesso
 *       400:
 *         description: Erro de validação dos arquivos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão de admin
 */
router.post('/portfolio', 
  authenticateToken,
  requireAdmin,
  ...portfolioValidator.multiple('photos'),
  handleMulterError,
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Nenhum arquivo enviado',
          },
        });
      }

      // Aqui você salvaria os arquivos no storage (AWS S3, Cloudinary, etc.)
      const uploadedFiles = files.map(file => ({
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        // url: 'https://storage.example.com/...' // URL após upload
      }));

      res.json({
        success: true,
        data: {
          message: 'Arquivos enviados com sucesso',
          files: uploadedFiles,
          count: files.length,
        },
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Erro interno do servidor',
        },
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/upload/avatar:
 *   post:
 *     summary: Upload de avatar do usuário
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar atualizado com sucesso
 *       400:
 *         description: Erro de validação do arquivo
 *       401:
 *         description: Não autenticado
 */
router.post('/avatar',
  authenticateToken,
  ...avatarValidator.single('avatar'),
  handleMulterError,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Avatar é obrigatório',
          },
        });
      }

      // Aqui você salvaria o arquivo e atualizaria o usuário no banco
      const avatarData = {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        userId: req.user?.id,
        // url: 'https://storage.example.com/...' // URL após upload
      };

      res.json({
        success: true,
        data: {
          message: 'Avatar atualizado com sucesso',
          avatar: avatarData,
        },
      });
    } catch (error) {
      console.error('Erro no upload do avatar:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Erro interno do servidor',
        },
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/upload/gallery:
 *   post:
 *     summary: Upload de imagens para galeria
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *     responses:
 *       200:
 *         description: Imagens enviadas com sucesso
 *       400:
 *         description: Erro de validação dos arquivos
 */
router.post('/gallery',
  ...imageValidator.multiple('images'),
  handleMulterError,
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      // Upload opcional - pode não ter arquivos
      const uploadedFiles = files?.map(file => ({
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      })) || [];

      res.json({
        success: true,
        data: {
          message: files?.length ? 'Imagens enviadas com sucesso' : 'Nenhuma imagem enviada',
          files: uploadedFiles,
          count: uploadedFiles.length,
        },
      });
    } catch (error) {
      console.error('Erro no upload da galeria:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Erro interno do servidor',
        },
      });
    }
  }
);

export default router;