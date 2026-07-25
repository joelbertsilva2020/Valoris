const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/env');
const statusRoutes = require('./routes/status');
const portalRoutes = require('./routes/portal');

const app = express();

app.use(cors());
app.use(express.json());

// Log simples de toda requisição recebida — ajuda a confirmar se o pedido
// do navegador está de fato chegando ao servidor.
app.use((req, res, next) => {
  console.log(`[Requisição recebida] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api', statusRoutes);
app.use('/api/portal', portalRoutes);

// Serve o app React já compilado (frontend/dist — gerado por "npm run build"
// dentro da pasta frontend). Cache desligado de propósito, para nunca servir
// uma versão antiga durante o desenvolvimento.
const pastaDist = path.join(__dirname, '..', '..', 'frontend', 'dist');

app.use(
  express.static(pastaDist, {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    },
  })
);

// O React Router cuida das rotas no navegador (ex: /contratos, /seguranca).
// Qualquer rota que não seja da API cai aqui e recebe o index.html, para o
// React assumir a partir daí.
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(pastaDist, 'index.html'));
});

// No Vercel, este arquivo é importado (por api/[...path].js) e o próprio
// Vercel cuida de servir frontend/dist e de receber as requisições — por
// isso o app.listen só roda quando este arquivo é executado diretamente
// (ou seja, no seu computador, via "npm run dev").
if (require.main === module) {
  app.listen(config.porta, () => {
    console.log(`Valoris Hub backend rodando na porta ${config.porta} (${config.nodeEnv})`);
  });
}

module.exports = app;
