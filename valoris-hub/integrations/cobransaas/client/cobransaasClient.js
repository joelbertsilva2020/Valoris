/**
 * Client real do CobranSaaS — v4.
 *
 * Endpoints confirmados na coleção Postman oficial "Assessorias" +
 * artigos da central de ajuda (Obtendo os Clientes, Obtendo os Contratos
 * de Clientes, Obtendo o Lote Ativo de Dívidas). Autenticação OAuth2
 * client_credentials confirmada (Basic código:token no /oauth/token),
 * chamadas via proxy PHP na HostGator (ver hostgator-proxy/).
 *
 * IMPORTANTE — pendente de decisão (não é bug, é design):
 * "Simular"/"Efetivar" acordo NÃO recebem a dívida diretamente. Eles pedem
 * um id de "negociação" (um modelo pré-configurado no painel do CobranSaaS,
 * tipo "à vista" ou "6x sem juros") + um id de "meioPagamento", e devolvem
 * os valores calculados para aquele cliente específico. Isso é diferente
 * do que o Portal assume hoje (proposta calculada livremente por contrato).
 * Antes de ligar de verdade a etapa de Propostas, precisamos decidir:
 * listar as negociações disponíveis e simular cada uma pro cliente, ou
 * simplificar de outra forma. listarPropostas() abaixo já usa o endpoint
 * certo, mas ainda depende dessa conversa pra ficar 100%.
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
    validateStatus: () => true,
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
    expiraEm = Date.now() + (Number(resposta.expires_in) - 120) * 1000;
    return tokenAtual;
  }

  async function chamarComAutenticacao(opcoes) {
    const token = await obterToken();
    try {
      return await chamarProxy({ ...opcoes, headers: { ...opcoes.headers, Authorization: `Bearer ${token}` } });
    } catch (erro) {
      if (erro.status === 401) {
        tokenAtual = null;
        const novoToken = await obterToken();
        return chamarProxy({ ...opcoes, headers: { ...opcoes.headers, Authorization: `Bearer ${novoToken}` } });
      }
      throw erro;
    }
  }

  return {
    async testarConexao() {
      await obterToken();
      return { status: 'ok', modo: 'real', tenant };
    },

    /**
     * Busca o cliente pelo CPF/CNPJ (campo "cic") e, se encontrado, lista
     * os contratos vinculados a ele.
     */
    async buscarContratosPorCpf(cpf) {
      const respostaClientes = await chamarComAutenticacao({
        method: 'GET',
        path: `/api/assessorias/clientes?cic=${encodeURIComponent(cpf)}`,
      });

      const clientes = respostaClientes.content || respostaClientes;
      const cliente = Array.isArray(clientes) ? clientes[0] : null;

      if (!cliente) {
        const erro = new Error('Cliente não encontrado para este CPF/CNPJ.');
        erro.status = 404;
        throw erro;
      }

      const respostaContratos = await chamarComAutenticacao({
        method: 'GET',
        path: `/api/assessorias/contratos?cliente=${cliente.id}`,
      });

      const contratos = respostaContratos.content || respostaContratos;

      return {
        clienteId: cliente.id,
        nome: cliente.nome,
        contratos: (contratos || []).map((c) => ({
          id: c.id,
          numero: c.numeroContrato,
          descricao: c.produto?.nome || 'Contrato',
          valorAtualizado: c.saldoAtual,
        })),
      };
    },

    /**
     * PENDENTE DE DESIGN (ver comentário no topo do arquivo) — lista as
     * negociações (modelos) disponíveis. Ainda falta decidir como isso
     * vira "propostas" pro cliente final ver no Portal.
     */
    async listarNegociacoesDisponiveis() {
      return chamarComAutenticacao({ method: 'GET', path: '/api/assessorias/negociacoes' });
    },

    /** PENDENTE — depende da conversa sobre negociação/meioPagamento. */
    async listarPropostas(contratoId) {
      throw new Error(
        '[CobranSaaS] listarPropostas ainda não está ligado ao fluxo real — depende de decidir como mapear negociações/meiosPagamento em propostas. Ver comentário no topo do arquivo.'
      );
    },

    /**
     * Efetiva o acordo de verdade. Formato do corpo confirmado na coleção
     * oficial (cliente, negociacao, meioPagamento, parcelas com desconto,
     * dados de parcelamento).
     */
    async confirmarAcordo(dadosAcordo) {
      return chamarComAutenticacao({
        method: 'POST',
        path: '/api/assessorias/acordos/efetivar',
        body: dadosAcordo,
      });
    },

    /**
     * Consulta os acordos de um cliente, sempre ao vivo (nunca decidir
     * status localmente).
     */
    async consultarAcordo(clienteId) {
      const resposta = await chamarComAutenticacao({
        method: 'GET',
        path: `/api/assessorias/acordos?cliente=${clienteId}`,
      });
      const acordos = resposta.content || resposta;
      return acordos && acordos.length > 0 ? acordos[0] : { existe: false };
    },
  };
}

module.exports = { criarCobranSaasClient };
