afterEach(() => {
  if (jest && typeof jest.clearAllMocks === 'function') {
    jest.clearAllMocks();
  }
});
