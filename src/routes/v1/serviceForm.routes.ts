import { Router } from 'express';
import { createServiceFormController } from '../../controllers/FormController';
import { middlewarePresets } from '../../middlewares';

const router = Router();

/**
 * @openapi
 * /api/v1/service-form:
 *   post:
 *     summary: Cria um novo formulário de solicitação de serviço fotográfico
 *     tags:
 *       - Service Form
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - phone
 *               - photo_session_type
 *               - message
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Ana Oliveira
 *               email:
 *                 type: string
 *                 example: ana.oliveira@example.com
 *               phone:
 *                 type: string
 *                 example: "21998765432"
 *               photo_session_type:
 *                 type: string
 *                 example: Ensaio de Família
 *               message:
 *                 type: string
 *                 example: Gostaria de agendar uma sessão para minha família no próximo sábado.
 *               status:
 *                 type: string
 *                 enum:
 *                   - pending
 *                   - confirmed
 *                   - in_progress
 *                   - completed
 *                   - cancelled
 *                 example: pending
 *               assigned_photographer:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *     responses:
 *       201:
 *         description: Formulário criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Formulário criado com sucesso!
 *                 data:
 *                   $ref: '#/components/schemas/ServiceForm'
 *       422:
 *         description: Campos obrigatórios inválidos.
 *       500:
 *         description: Erro interno do servidor.
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ServiceForm:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 67b61c40-9a12-4e32-a23e-8c0ab19f48f7
 *         full_name:
 *           type: string
 *           example: Ana Oliveira
 *         email:
 *           type: string
 *           example: ana.oliveira@example.com
 *         phone:
 *           type: string
 *           example: "+55 85 99876-5432"
 *         photo_session_type:
 *           type: string
 *           example: Ensaio de Família
 *         message:
 *           type: string
 *           example: Gostaria de agendar uma sessão...
 *         status:
 *           type: string
 *           enum:
 *             - pending
 *             - confirmed
 *             - in_progress
 *             - completed
 *             - cancelled
 *           example: pending
 *         assigned_photographer:
 *           type: string
 *           nullable: true
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-11-01T22:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-11-01T22:00:00.000Z"
 */

router.post('/', middlewarePresets.publicForm, createServiceFormController);

export default router;
