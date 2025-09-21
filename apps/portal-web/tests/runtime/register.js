const Module = require('module');
const React = require('react');
const path = require('path');

const originalLoad = Module._load;

Module._load = function patchedLoader(request, parent, isMain) {
  if (request === 'ui-kit') {
    return {
      Badge: ({ children }) => React.createElement('span', { 'data-testid': 'badge' }, children),
      Button: ({ children }) =>
        React.createElement('button', { 'data-testid': 'button', type: 'button' }, children)
    };
  }
  if (request === 'ui-kit/status') {
    const target = path.resolve(
      __dirname,
      '..',
      '..',
      'dist-tests',
      'apps',
      'portal-web',
      'tests',
      'stubs',
      'ui-kit.js'
    );
    // eslint-disable-next-line global-require
    return require(target);
  }
  if (request === '@/lib/api') {
    const target = path.resolve(__dirname, '..', '..', 'dist-tests', 'apps', 'portal-web', 'lib', 'api.js');
    // eslint-disable-next-line global-require
    return require(target);
  }
  if (request === '@/lib/market-data') {
    const target = path.resolve(__dirname, '..', '..', 'dist-tests', 'apps', 'portal-web', 'lib', 'market-data.js');
    // eslint-disable-next-line global-require
    return require(target);
  }
  if (request === '@/lib/quote-pricing') {
    const target = path.resolve(__dirname, '..', '..', 'dist-tests', 'apps', 'portal-web', 'lib', 'quote-pricing.js');
    // eslint-disable-next-line global-require
    return require(target);
  }
  if (request === '@shared/api/client') {
    const target = path.resolve(__dirname, '..', '..', 'dist-tests', 'apps', 'shared', 'api', 'client.js');
    // eslint-disable-next-line global-require
    return require(target);
  }
  if (request === '@shared/api/config') {
    const target = path.resolve(__dirname, '..', '..', 'dist-tests', 'apps', 'shared', 'api', 'config.js');
    // eslint-disable-next-line global-require
    return require(target);
  }
  return originalLoad(request, parent, isMain);
};
