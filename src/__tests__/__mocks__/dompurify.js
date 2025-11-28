module.exports = jest.fn().mockImplementation(() => ({
  sanitize: jest.fn().mockImplementation((str) => str.replace(/<[^>]*>/g, '')),
}));
