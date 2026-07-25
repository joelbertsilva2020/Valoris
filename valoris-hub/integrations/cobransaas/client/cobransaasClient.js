/**
 * Client HTTP real do CobranSaaS — v2.
 *
 * Regra de negócio (não violar): este client NUNCA calcula parcelas, juros,
 * descontos, entrada ou vencimentos. Ele apenas repassa o que o CobranSaaS
 * retorna. O único cálculo próprio do Valoris Hub é o "Percentual de
 * Economia", feito na camada de serviço (backend/src/services), não aqui.
 *
 * IMPORTANTE: os caminhos de rota abaixo (/contratos, /simulacao, etc.) são
 * placeholders — ainda não confirmados com a documentação real do
 * CobranSaaS. Quando o IP fixo for liberado e a documentação de fato
 * consultada, ajustar aqui. Até lá, o backend usa o mock
 * (integrations/cobransaas/mock), que tem a mesma "interface" (mesmos
 * métodos) deste client.
 */

const axios = require('axios');

function criarCobranSaasClient({ baseURL, tenant, appToken }) {
  if (!baseURL || !tenant || !appToken) {
    throw new Error(
      '[CobranSaaS] Configuração incompleta: baseURL, tenant e appToken são obrigatórios.'
    );
  }

  const http = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      Authorization: `Bearer ${appToken}`,
      'X-Tenant': tenant,
      'Content-Type': 'application/json',
    },
  });

  http.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const mensagem = error.response?.data?.message || error.message;

      if (status === 401 || status === 403) {
        console.error(
          `[CobranSaaS] Falha de autenticação/IP não liberado (status ${status}): ${mensagem}`
        );
      } else {
        console.error(`[CobranSaaS] Erro na requisição: ${mensagem}`);
      }

      return Promise.reject(error);
    }
  );

  return {
    async testarConexao() {
      const { data } = await http.get('/status');
      return data;
    },

    /** Placeholder — confirmar endpoint real de busca de contratos por CPF. */
    async buscarContratosPorCpf(cpf) {
      const { data } = await http.get(`/clientes/${cpf}/contratos`);
      return data;
    },

    /** Placeholder — confirmar endpoint real de simulação de propostas. */
    async listarPropostas(contratoId) {
      const { data } = await http.get(`/contratos/${contratoId}/propostas`);
      return data;
    },

    /** Placeholder — confirmar endpoint real de efetivação de acordo. */
    async confirmarAcordo(contratoId, propostaEscolhida) {
      const { data } = await http.post(`/contratos/${contratoId}/acordos`, {
        proposta: propostaEscolhida,
      });
      return data;
    },

    /** Placeholder — confirmar endpoint real de consulta de status do acordo. */
    async consultarAcordo(contratoId) {
      const { data } = await http.get(`/contratos/${contratoId}/acordo`);
      return data;
    },
  };
}

module.exports = { criarCobranSaasClient };
