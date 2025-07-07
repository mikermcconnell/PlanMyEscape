const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const { NPS_API_KEY } = process.env;

  app.use(
    '/api/parks',
    createProxyMiddleware({
      target: 'https://developer.nps.gov',
      changeOrigin: true,
      pathRewrite: {
        '^/api/parks': '/api/v1/parks',
      },
      onProxyReq: (proxyReq, req) => {
        // append API key
        const url = new URL(proxyReq.path, 'https://developer.nps.gov');
        url.searchParams.set('api_key', NPS_API_KEY || '');
        proxyReq.path = url.pathname + url.search;
      },
    })
  );
}; 