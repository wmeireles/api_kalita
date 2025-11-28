// Silenciar logs durante os testes
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
