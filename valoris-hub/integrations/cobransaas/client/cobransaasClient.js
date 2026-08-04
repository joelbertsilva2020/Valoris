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
 *
 * CPF sem cliente cadastrado no CobranSaaS NÃO é erro — devolve resultado
 * vazio, igual ao caso de cliente existente sem contratos (ver
 * buscarContratosPorCpf).
 *
 * DIAGNÓSTICO TEMPORÁRIO: listarPropostas também devolve um array
 * `diagnostico` com o resultado de cada negociação simulada (sucesso,
 * quantas propostas gerou, ou o erro/motivo de não ter gerado nenhuma).
 * Serve pra investigar casos como "cliente com acordo em condições de
 * negociar mas nenhuma proposta aparece". Pode ser removido depois que
 * o motivo for confirmado.
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
    // CORREÇÃO: numeroParcelas="1" não é à vista — é "entrada + 1 parcela
    // real", um parcelamento de 2 pagamentos. Só numeroParcelas=0 é à
    // vista de verdade. (O <=1 antigo fazia duas opções aparecerem como
    // "à vista", com valores/datas diferentes, confundindo o cliente.)
    const numParcelas = Number(parcelamento.numeroParcelas) || 0;
    const ehAVista = numParcelas <= 0;

    const base = {
      // Guardado pra montar o objeto `parcelamento` exigido pelo
      // /acordos/efetivar (numeroParcelas, valorEntrada, dataEmissao,
      // dataVencimento, descontoDivida, taxaOperacao, descontoTarifa,
      // descontoTarifaParcela) — copiado direto da simulação, sem
      // recalcular nada por conta própria.
      _parcelamentoBruto: parcelamento,
      // Precisam ir em TODO tipo de proposta (à vista ou parcelado) —
      // sem isso o efetivar de uma proposta à vista mandaria
      // negociacao/meioPagamento vazios.
      _negociacaoId: negociacaoId,
      _meioPagamentoId: parcelamento.meioPagamento?.id,
    };

    if (ehAVista) {
      return {
        ...base,
        id: `${negociacaoId}_avista`,
        tipo: 'a_vista',
        valorTotal: parcelamento.valorTotal,
        vencimentoMaximo: parcelamento.dataVencimento,
      };
    }

    return {
      ...base,
      id: `${negociacaoId}_${numParcelas}x`,
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
     *
     * Se não existe cliente cadastrado para esse CPF/CNPJ, devolve um
     * resultado vazio (não é erro) — o Portal trata isso exatamente igual
     * a "cliente existe mas não tem contratos", levando pra tela de
     * "nenhuma oportunidade encontrada".
     */
    async buscarContratosPorCpf(cpf) {
      const respostaClientes = await chamarComAutenticacao({
        method: 'GET',
        path: `/api/assessorias/clientes?cic=${encodeURIComponent(cpf)}`,
      });

      const clientes = respostaClientes.content || respostaClientes;
      const cliente = Array.isArray(clientes) ? clientes[0] : null;

      if (!cliente) {
        return { clienteId: null, nome: null, contratos: [] };
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
     * Simula cada negociação disponível pro cliente. Pra cada negociação,
     * faz DUAS chamadas de simulação:
     * 1) uma "prévia" simples, só pra descobrir quanto de desconto de
     *    principal (descontoPrincipalMax) o CobranSaaS permite pra cada
     *    parcela da dívida;
     * 2) uma simulação final, mandando de volta pro CobranSaaS essas
     *    mesmas parcelas com `descontoPrincipal` = o máximo permitido —
     *    é o próprio CobranSaaS que recalcula os parcelamentos já com o
     *    desconto aplicado de verdade (documentado em POST
     *    /api/acordos/simular, campo `parcelas: [{parcela, descontoPrincipal}]`).
     * Isso segue a regra de nunca calcularmos desconto por conta própria —
     * quem aplica é sempre o CobranSaaS.
     * Quando não há desconto disponível (descontoPrincipalMax = 0 em
     * todas as parcelas), pula a segunda chamada e usa a prévia mesmo.
     */
    async listarPropostas(clienteId) {
      const negociacoes = await this.listarNegociacoesDisponiveis();

      const diagnostico = [];

      const resultados = await Promise.all(
        negociacoes.map(async (negociacao) => {
          const corpoBase = { cliente: clienteId, negociacao: negociacao.id };
          try {
            const previa = await chamarComAutenticacao({
              method: 'POST',
              path: '/api/assessorias/acordos/simular',
              headers: { 'Content-Type': 'application/json' },
              body: corpoBase,
            });

            const parcelasComDesconto = (previa.parcelas || [])
              .filter((p) => Number(p.descontoPrincipalMax) > 0)
              .map((p) => ({ parcela: p.parcela, descontoPrincipal: Number(p.descontoPrincipalMax) }));

            let respostaFinal = previa;
            let corpoFinal = corpoBase;

            if (parcelasComDesconto.length > 0) {
              corpoFinal = { ...corpoBase, parcelas: parcelasComDesconto };
              respostaFinal = await chamarComAutenticacao({
                method: 'POST',
                path: '/api/assessorias/acordos/simular',
                headers: { 'Content-Type': 'application/json' },
                body: corpoFinal,
              });
            }

            diagnostico.push({
              negociacaoId: negociacao.id,
              negociacaoNome: negociacao.nome || negociacao.descricao,
              ok: true,
              descontoDisponivel: parcelasComDesconto.length > 0,
              parcelasComDesconto,
              corpoEnviado: corpoFinal,
              parcelamentosGerados: (respostaFinal.parcelamentos || []).filter((p) => p.habilitado !== false).length,
              totalParcelamentosNaResposta: (respostaFinal.parcelamentos || []).length,
              valorDivida: respostaFinal.valorDivida,
              respostaCompleta: respostaFinal,
            });

            return { resposta: respostaFinal, parcelasComDesconto };
          } catch (erro) {
            diagnostico.push({
              negociacaoId: negociacao.id,
              negociacaoNome: negociacao.nome || negociacao.descricao,
              ok: false,
              corpoEnviado: corpoBase,
              status: erro.status || null,
              detalhe: erro.detalhe || erro.message,
            });
            console.error(
              `[CobranSaaS] Falha ao simular negociação ${negociacao.id} pro cliente ${clienteId}:`,
              erro.status,
              JSON.stringify(erro.detalhe || erro.message)
            );
            return null;
          }
        })
      );

      let valorAtualizadoContrato = null;
      let diasAtraso = null;
      const propostas = [];

      resultados.forEach((item, i) => {
        if (!item) return;
        const { resposta, parcelasComDesconto } = item;
        if (valorAtualizadoContrato === null) valorAtualizadoContrato = resposta.valorDivida;
        if (diasAtraso === null) {
          const maiorAtraso = (resposta.parcelas || []).reduce(
            (max, p) => Math.max(max, Number(p.diasAtraso) || 0),
            0
          );
          diasAtraso = maiorAtraso || null;
        }
        (resposta.parcelamentos || [])
          .filter((p) => p.habilitado !== false)
          .forEach((parcelamento) => {
            const proposta = mapearParcelamentoParaProposta(negociacoes[i].id, parcelamento);
            // Guardado pra reaplicar o mesmo desconto na hora de efetivar
            // (ver confirmarAcordo) — sem isso o acordo seria criado sem
            // o desconto que foi mostrado ao cliente.
            proposta._parcelasComDesconto = parcelasComDesconto;
            propostas.push(proposta);
          });
      });

      return {
        valorAtualizadoContrato,
        diasAtraso,
        propostas,
        diagnostico: { totalNegociacoesConfiguradas: negociacoes.length, tentativas: diagnostico },
      };
    },

    /**
     * Efetiva o acordo de verdade — POST /api/acordos/efetivar.
     *
     * A documentação oficial (Efetivar_Acordo.pdf) mostra que esse
     * endpoint é BEM diferente do /simular: exige um objeto
     * `parcelamento` completo (numeroParcelas, valorEntrada, dataEmissao,
     * dataVencimento, descontoDivida, taxaOperacao, descontoTarifa —
     * todos obrigatórios), montado aqui copiando exatamente os valores
     * que a simulação (já com desconto aplicado) devolveu — nunca
     * recalculados por nós. Se `parcelas` (lista de desconto por parcela)
     * for enviada, cada item exige TODOS os campos de desconto (mesmo
     * que zero), diferente do /simular onde eram opcionais.
     */
    async confirmarAcordo(clienteId, proposta) {
      const bruto = proposta._parcelamentoBruto || {};

      const corpo = {
        cliente: clienteId,
        negociacao: proposta._negociacaoId,
        meioPagamento: proposta._meioPagamentoId,
        parcelamento: {
          numeroParcelas: Number(bruto.numeroParcelas) || 0,
          valorEntrada: Number(bruto.valorEntrada) || 0,
          dataEmissao: bruto.dataEmissao,
          dataVencimento: bruto.dataVencimento,
          descontoDivida: Number(bruto.descontoDivida) || 0,
          taxaOperacao: Number(bruto.taxaOperacao) || 0,
          descontoTarifa: Number(bruto.descontoTarifa) || 0,
          descontoTarifaParcela: Number(bruto.descontoTarifaParcela) || 0,
        },
      };

      if (proposta._parcelasComDesconto && proposta._parcelasComDesconto.length > 0) {
        // No /efetivar, ao contrário do /simular, todo campo de desconto
        // da Parcela é obrigatório — completamos com 0 os que não usamos.
        corpo.parcelas = proposta._parcelasComDesconto.map((p) => ({
          parcela: p.parcela,
          descontoPrincipal: Number(p.descontoPrincipal) || 0,
          descontoJuros: 0,
          descontoPermanencia: 0,
          descontoMora: 0,
          descontoMulta: 0,
          descontoOutros: 0,
          valorDesconto: Number(p.descontoPrincipal) || 0,
        }));
      }

      return chamarComAutenticacao({
        method: 'POST',
        path: '/api/assessorias/acordos/efetivar',
        headers: { 'Content-Type': 'application/json' },
        body: corpo,
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
