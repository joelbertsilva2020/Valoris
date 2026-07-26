/**
 * Client real do CobranSaaS — v3.
 *
 * Autenticação confirmada na documentação oficial: OAuth2 client_credentials
 * (POST /oauth/token com Basic Auth do código+token do aplicativo), token
 * Bearer válido por ~2h, com possibilidade de invalidação antecipada por
 * rotação de segredo (nesse caso, reautentica e tenta de novo uma vez).
 *
 * As chamadas passam pelo proxy PHP hospedado na HostGator (não pelo
 * CobranSaaS direto), porque o Vercel não tem IP de saída fixo e o
 * CobranSaaS exige IP liberado numa allowlist. Ver hostgator-proxy/.
 *
 * IMPORTANTE — pendente: os caminhos de dados (buscar contratos por CPF,
 * listar propostas, confirmar acordo, consultar acordo) ainda são
 * PLACEHOLDERS. A documentação recebida até agora cobre autenticação e
 * webhooks, não o CRUD de contratos/negociação (isso fica em "docs-api" ou
 * "docs-assessoria-api" no painel do CobranSaaS). Ajustar os caminhos
 * abaixo assim que essa documentação chegar.
 */

const axios = require('axios');

function criarCobranSaasClient({ proxyUrl, proxySecret, codigoAplicativo, tokenAplicativo, tenant }) {
  if (!proxyUrl || !proxySecret || !codigoAplicativo || !tokenAplicativo) {
    throw new Error(
      '[CobranSaaS] Configuração incompleta: proxyUrl, proxySecret, codigoAplicativo e tokenAplicativo são obrigatórios.'
    );
  }

  let tokenAtual = null;
  let expiraEm = 0;

  const proxy = axios.create({
    baseURL: proxyUrl,
    timeout: 20000,
    headers: { 'X-Proxy-Secret': proxySecret, 'Content-Type': 'application/json' },
    validateStatus: () => true, // tratamos o status manualmente abaixo
  });

  async function chamarProxy({ method, path, headers = {}, body = null }) {
    const { data, status } = await proxy.post('', { method, path, headers, body });

    if (status >= 400) {
      const erro = new Error(`[CobranSaaS] Proxy/CobranSaaS retornou ${status}`);
      erro.status = status;
      erro.detalhe = data;
      throw erro;
    }
    return data;
  }

  async function obterToken() {
    if (tokenAtual && Date.now() < expiraEm) return tokenAtual;

    const credencial = Buffer.from(`${codigoAplicativo}:${tokenAplicativo}`).toString('base64');

    const resposta = await chamarProxy({
      method: 'POST',
      path: '/oauth/token?grant_type=client_credentials',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credencial}`,
      },
    });

    tokenAtual = resposta.access_token;
    // Margem de segurança de 2 minutos antes do vencimento informado.
    expiraEm = Date.now() + (Number(resposta.expires_in) - 120) * 1000;
    return tokenAtual;
  }

  async function chamarComAutenticacao(opcoes) {
    const token = await obterToken();

    try {
      return await chamarProxy({
        ...opcoes,
        headers: { ...opcoes.headers, Authorization: `Bearer ${token}` },
      });
    } catch (erro) {
      // "Ainda que o token não tenha expirado, uma requisição pode ser
      // recusada com 401 pois periodicamente atualizamos os segredos" —
      // conforme a própria documentação do CobranSaaS. Reautentica 1x.
      if (erro.status === 401) {
        tokenAtual = null;
        const novoToken = await obterToken();
        return chamarProxy({
          ...opcoes,
          headers: { ...opcoes.headers, Authorization: `Bearer ${novoToken}` },
        });
      }
      throw erro;
    }
  }

  return {
    async testarConexao() {
      await obterToken();
      return { status: 'ok', modo: 'real', tenant };
    },

    /** PLACEHOLDER — endpoint real ainda não confirmado. */
    async buscarContratosPorCpf(cpf) {
      return chamarComAutenticacao({ method: 'GET', path: `/api/clientes/${cpf}/contratos` });
    },

    /** PLACEHOLDER — endpoint real ainda não confirmado. */
    async listarPropostas(contratoId) {
      return chamarComAutenticacao({ method: 'GET', path: `/api/contratos/${contratoId}/propostas` });
    },

    /** PLACEHOLDER — endpoint real ainda não confirmado. */
    async confirmarAcordo(contratoId, propostaEscolhida) {
      return chamarComAutenticacao({
        method: 'POST',
        path: `/api/contratos/${contratoId}/acordos`,
        body: { proposta: propostaEscolhida },
      });
    },

    /** PLACEHOLDER — endpoint real ainda não confirmado. */
    async consultarAcordo(contratoId) {
      return chamarComAutenticacao({ method: 'GET', path: `/api/contratos/${contratoId}/acordo` });
    },
  };
}

module.exports = { criarCobranSaasClient };
