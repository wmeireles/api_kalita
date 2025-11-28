import {
  corsOptions,
  adminCorsOptions,
  publicCorsOptions,
} from '../../middlewares/cors';

describe('CORS Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('General CORS Options', () => {
    it('should have correct methods configured', () => {
      expect(corsOptions.methods).toEqual([
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'OPTIONS',
        'PATCH',
      ]);
    });

    it('should have credentials enabled', () => {
      expect(corsOptions.credentials).toBe(true);
    });

    it('should have correct allowed headers', () => {
      expect(corsOptions.allowedHeaders).toContain('Authorization');
      expect(corsOptions.allowedHeaders).toContain('Content-Type');
      expect(corsOptions.allowedHeaders).toContain('X-Admin-Token');
    });
  });

  describe('Admin CORS Options', () => {
    it('should have more restrictive methods', () => {
      expect(adminCorsOptions.methods).toEqual([
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
      ]);
      expect(adminCorsOptions.methods).not.toContain('OPTIONS');
    });

    it('should have credentials enabled', () => {
      expect(adminCorsOptions.credentials).toBe(true);
    });

    it('should have shorter max age', () => {
      expect(adminCorsOptions.maxAge).toBe(3600);
    });
  });

  describe('Public CORS Options', () => {
    it('should have limited methods', () => {
      expect(publicCorsOptions.methods).toEqual(['GET', 'POST', 'OPTIONS']);
    });

    it('should have credentials disabled', () => {
      expect(publicCorsOptions.credentials).toBe(false);
    });

    it('should have basic headers only', () => {
      expect(publicCorsOptions.allowedHeaders).toEqual([
        'Content-Type',
        'Accept',
        'Origin',
      ]);
    });
  });
});
