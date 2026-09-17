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

  // The Chronos-2 inference server sends no CORS headers, so in development the
  // dev server proxies it under the same /chronos path the production ingress
  // serves it on.
  //
  // CHRONOS_API_TOKEN is deliberately NOT prefixed with REACT_APP_, so it stays
  // in the dev server's Node process and never reaches the browser bundle. The
  // production equivalent is the Authorization header injected by the ingress.
  app.use(
    '/chronos',
    createProxyMiddleware({
      target: process.env.CHRONOS_PROXY_TARGET || 'https://chronos2-inference-server.aiodp.ai',
      changeOrigin: true,
      pathRewrite: {
        '^/chronos': '',
      },
      onProxyReq: (proxyReq, req, res) => {
        if (process.env.CHRONOS_API_TOKEN) {
          proxyReq.setHeader('Authorization', `Bearer ${process.env.CHRONOS_API_TOKEN}`);
        }
      },
      onError: (err, req, res) => {
        console.error('Chronos proxy error:', err);
      },
    })
  );
};
