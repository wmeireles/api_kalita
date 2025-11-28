module.exports = {
  JSDOM: jest.fn().mockImplementation(() => ({
    window: {
      document: {},
      DOMParser: function () {},
      XMLSerializer: function () {},
    },
  })),
};
