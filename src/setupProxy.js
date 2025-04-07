const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/connect/token',
    createProxyMiddleware({
      target: 'https://platform.aiodp.ai',
      changeOrigin: true,
      pathRewrite: {
        '^/connect/token': '/connect/token',
      },
      onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        console.log('Proxying request:', req.method, req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        console.log('Received response from target:', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
      },
    })
  );
};
