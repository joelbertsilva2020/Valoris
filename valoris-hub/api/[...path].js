/**
 * Ponte entre o Vercel (que roda funções serverless) e o backend Express
 * que já existe em backend/src/server.js — o mesmo código que roda local
 * com "npm run dev" roda aqui, sem duplicar nada.
 *
 * O nome do arquivo ([...path].js) é uma convenção do Vercel: captura
 * QUALQUER rota dentro de /api/*, e repassa pro Express decidir o que
 * fazer com ela (igual já fazia localmente).
 */
const serverless = require('serverless-http');
const app = require('../backend/src/server');

module.exports = serverless(app);
