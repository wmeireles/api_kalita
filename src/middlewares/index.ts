// Middlewares de segurança
export * from './security';
export * from './xssSanitizer';
export * from './permissions';

// Middlewares existentes
export * from './cors';
export * from './fileValidation';
export * from './Errors';
export * from './dynamicCors';

// Combinações úteis de middlewares
import { xssSanitizer, adminSanitizer, formSanitizer } from './xssSanitizer';
import { securityPresets } from './security';
import {
  portfolioPermissions,
  categoryPermissions,
  uploadPermissions,
  requireAdmin,
} from './permissions';

/**
 * Middlewares combinados para diferentes cenários
 */
export const middlewarePresets = {
  // Para rotas públicas de leitura
  publicRead: [...securityPresets.public, xssSanitizer()],

  // Para formulários públicos
  publicForm: [...securityPresets.form, formSanitizer],

  // Para uploads públicos (se permitido)
  publicUpload: [...securityPresets.upload, xssSanitizer()],

  // Para operações administrativas
  adminOperation: [...securityPresets.admin, adminSanitizer, ...requireAdmin],

  // Para operações de portfólio
  portfolioRead: [
    ...securityPresets.public,
    xssSanitizer(),
    ...portfolioPermissions.read,
  ],

  portfolioCreate: [
    ...securityPresets.admin,
    adminSanitizer,
    ...portfolioPermissions.create,
  ],

  portfolioUpdate: [
    ...securityPresets.admin,
    adminSanitizer,
    ...portfolioPermissions.update,
  ],

  portfolioDelete: [
    ...securityPresets.admin,
    adminSanitizer,
    ...portfolioPermissions.delete,
  ],

  portfolioBulk: [
    ...securityPresets.admin,
    adminSanitizer,
    ...portfolioPermissions.bulk,
  ],

  // Para operações de categoria
  categoryRead: [
    ...securityPresets.public,
    xssSanitizer(),
    ...categoryPermissions.read,
  ],

  categoryCreate: [
    ...securityPresets.admin,
    adminSanitizer,
    ...categoryPermissions.create,
  ],

  categoryUpdate: [
    ...securityPresets.admin,
    adminSanitizer,
    ...categoryPermissions.update,
  ],

  categoryDelete: [
    ...securityPresets.admin,
    adminSanitizer,
    ...categoryPermissions.delete,
  ],

  // Para operações de upload
  uploadSingle: [
    ...securityPresets.upload,
    xssSanitizer(),
    ...uploadPermissions.single,
  ],

  uploadMultiple: [
    ...securityPresets.upload,
    xssSanitizer(),
    ...uploadPermissions.multiple,
  ],

  uploadDelete: [
    ...securityPresets.admin,
    adminSanitizer,
    ...uploadPermissions.delete,
  ],
};
