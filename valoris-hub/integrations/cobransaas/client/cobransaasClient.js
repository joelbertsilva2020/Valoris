/**
 * Client real do CobranSaaS — v5.
 *
 * Endpoints e formatos confirmados na coleção Postman oficial "Assessorias"
 * + artigos da central de ajuda + documentação "Simular acordo"
 * (POST /api/acordos/simular). Autenticação OAuth2 client_credentials
 * confirmada (Basic código:token no /oauth/token), chamadas via proxy PHP
 * na HostGator (ver hostgator-proxy/).
 *
 * IMPORTANTE: a API real identifica tudo por CLIENTE (clienteId), não por
 * contrato — "simular", "efetivar" e "consultar acordo" recebem o cliente,
 * não o contrato. Por isso o service/rotas/frontend precisam carregar o
 * clienteId junto com o contratoId a partir da tela de Contratos (ver
 * portalService.js).
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

  /**
   * Um "parcelamento" retornado pelo simular vira uma proposta pro Portal.
   * numeroParcelas 1 (ou ausência de parcelas) = à vista.
   */
  function mapearParcelamentoParaProposta(negociacaoId, parcelamento) {
    const ehAVista = !parcelamento.numeroParcelas || parcelamento.numeroParcelas <= 1;

    if (ehAVista) {
      return {
        id: `${negociacaoId}_avista`,
        tipo: 'a_vista',
        valorTotal: parcelamento.valorTotal,
        vencimentoMaximo: parcelamento.dataVencimento,
      };
    }

    return {
      id: `${negociacaoId}_${parcelamento.numeroParcelas}x`,
      tipo: 'parcelado',
      valorTotal: parcelamento.valorTotal,
      entrada: parcelamento.valorEntrada
        ? { valor: parcelamento.valorEntrada, vencimento: parcelamento.dataEmissao }
        : undefined,
      parcelas: (parcelamento.parcelas || []).map((p) => ({
        numero: p.numeroParcela,
        valor: p.valorTotal,
        vencimento: p.dataVencimento,
      })),
      // guardado pra montar o corpo do "efetivar" depois, sem expor no front
      _negociacaoId: negociacaoId,
      _meioPagamentoId: parcelamento.meioPagamento?.id,
    };
  }

  return {
    async testarConexao() {
      await obterToken();
      return { status: 'ok', modo: 'real', tenant };
    },

    /**
     * Busca o cliente pelo CPF/CNPJ (campo "cic") e lista os contratos
     * vinculados. Cada contrato carrega o clienteId junto — necessário
     * porque simular/efetivar/consultar acordo pedem o cliente, não o
     * contrato.
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
          clienteId: cliente.id,
          numero: c.numeroContrato,
          descricao: c.produto?.nome || 'Contrato',
          valorAtualizado: c.saldoAtual,
        })),
      };
    },

    /** Lista as negociações (modelos) configuradas na conta. */
    async listarNegociacoesDisponiveis() {
      const resposta = await chamarComAutenticacao({ method: 'GET', path: '/api/assessorias/negociacoes' });
      return resposta.content || resposta;
    },

    /**
     * Simula cada negociação disponível pro cliente e junta todos os
     * parcelamentos retornados numa lista só de propostas.
     */
    async listarPropostas(clienteId) {
      const negociacoes = await this.listarNegociacoesDisponiveis();

      const respostasSimulacao = await Promise.all(
        negociacoes.map((negociacao) =>
          chamarComAutenticacao({
            method: 'POST',
            path: '/api/assessorias/acordos/simular',
            body: { cliente: clienteId, negociacao: negociacao.id },
          }).catch(() => null) // uma negociação não aplicável ao cliente não deve derrubar as outras
        )
      );

      let valorAtualizadoContrato = null;
      const propostas = [];

      respostasSimulacao.forEach((resposta, i) => {
        if (!resposta) return;
        if (valorAtualizadoContrato === null) valorAtualizadoContrato = resposta.valorDivida;
        (resposta.parcelamentos || [])
          .filter((p) => p.habilitado !== false)
          .forEach((parcelamento) => {
            propostas.push(mapearParcelamentoParaProposta(negociacoes[i].id, parcelamento));
          });
      });

      return { valorAtualizadoContrato, propostas };
    },

    /**
     * Efetiva o acordo de verdade. `proposta` é o objeto de proposta que
     * veio de listarPropostas (já carrega _negociacaoId/_meioPagamentoId).
     */
    async confirmarAcordo(clienteId, proposta) {
      return chamarComAutenticacao({
        method: 'POST',
        path: '/api/assessorias/acordos/efetivar',
        body: {
          cliente: clienteId,
          negociacao: proposta._negociacaoId,
          meioPagamento: proposta._meioPagamentoId,
        },
      });
    },

    /** Consulta os acordos de um cliente, sempre ao vivo. */
    async consultarAcordo(clienteId) {
      const resposta = await chamarComAutenticacao({
        method: 'GET',
        path: `/api/assessorias/acordos?cliente=${clienteId}`,
      });
      const acordos = resposta.content || resposta;
      return acordos && acordos.length > 0 ? { existe: true, ...acordos[0] } : { existe: false };
    },
  };
}

module.exports = { criarCobranSaasClient };
