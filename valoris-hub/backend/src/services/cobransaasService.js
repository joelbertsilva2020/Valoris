/**
 * Ponto único de acesso ao CobranSaaS dentro do backend.
 *
 * Todo o resto do backend (rotas, outros services) deve importar o
 * CobranSaaS APENAS por aqui — nunca direto de integrations/. Isso garante
 * que a troca mock <-> API real (quando o IP fixo for liberado) aconteça
 * num único lugar, só mexendo no .env.
 */

const config = require('../config/env');
const { criarCobranSaasClient } = require('../../../integrations/cobransaas/client/cobransaasClient');
const { criarCobranSaasMock } = require('../../../integrations/cobransaas/mock/cobransaasMock');

let instancia = null;

function getCobranSaasService() {
  if (instancia) return instancia;

  if (config.cobransaas.usarMock) {
    console.log('[CobranSaaS] Rodando em modo MOCK (sem IP fixo liberado ainda).');
    instancia = criarCobranSaasMock();
  } else {
    console.log('[CobranSaaS] Rodando contra a API real.');
    instancia = criarCobranSaasClient({
      proxyUrl: config.cobransaas.proxyUrl,
      proxySecret: config.cobransaas.proxySecret,
      codigoAplicativo: config.cobransaas.codigoAplicativo,
      tokenAplicativo: config.cobransaas.tokenAplicativo,
      tenant: config.cobransaas.tenant,
    });
  }

  return instancia;
}

module.exports = { getCobranSaasService };
