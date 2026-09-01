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

// ---------------------------------------------------------------------------
// Utilidades de data — só agenda DENTRO da janela que o próprio CobranSaaS
// permite (dataEmissaoMin/Max, dataVencimentoMin/Max, devolvidas por ele
// mesmo na 1ª simulação). Nenhum valor financeiro é calculado aqui, só
// datas comerciais da Valoris (regra: entrada = dataEmissaoMin + 3 dias
// úteis; 1ª parcela = entrada + 30 dias corridos).
// ---------------------------------------------------------------------------

function paraData(isoDate) {
  const [ano, mes, dia] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function paraIso(data) {
  return data.toISOString().slice(0, 10);
}

/** Soma dias ÚTEIS (pula sábado/domingo — feriados não são considerados,
 * não temos calendário de feriados disponível). */
function somarDiasUteis(dataBase, quantidade) {
  const resultado = new Date(dataBase);
  let somados = 0;
  while (somados < quantidade) {
    resultado.setUTCDate(resultado.getUTCDate() + 1);
    const diaSemana = resultado.getUTCDay();
    if (diaSemana !== 0 && diaSemana !== 6) somados++;
  }
  return resultado;
}

function somarDiasCorridos(dataBase, quantidade) {
  const resultado = new Date(dataBase);
  resultado.setUTCDate(resultado.getUTCDate() + quantidade);
  return resultado;
}

/** Prende uma data ISO dentro de [min, max], se vierem informados. */
function limitarIntervalo(valorIso, minIso, maxIso) {
  let v = valorIso;
  if (minIso && v < minIso) v = minIso;
  if (maxIso && v > maxIso) v = maxIso;
  return v;
}

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

  /** Igual chamarProxy, mas pra respostas binárias (PDF do boleto) — não
   * tenta interpretar a resposta como JSON. */
  async function chamarProxyBinario({ method, path, headers = {} }) {
    const { data, status } = await proxy.post(
      '',
      { method, path, headers, body: null },
      { responseType: 'arraybuffer' }
    );
    if (status >= 400) {
      const erro = new Error(`[CobranSaaS] Proxy/CobranSaaS retornou ${status}`);
      erro.status = status;
      throw erro;
    }
    return Buffer.from(data);
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

  async function chamarComAutenticacaoBinario(opcoes) {
    const token = await obterToken();
    try {
      return await chamarProxyBinario({ ...opcoes, headers: { ...opcoes.headers, Authorization: `Bearer ${token}` } });
    } catch (erro) {
      if (erro.status === 401) {
        tokenAtual = null;
        const novoToken = await obterToken();
        return chamarProxyBinario({ ...opcoes, headers: { ...opcoes.headers, Authorization: `Bearer ${novoToken}` } });
      }
      throw erro;
    }
  }

  /**
   * Um "parcelamento" retornado pelo simular vira uma proposta pro Portal.
   * numeroParcelas 1 (ou ausência de parcelas) = à vista.
   */
  function mapearParcelamentoParaProposta(negociacaoId, parcelamento, meioPagamentoId) {
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
      // O campo `parcelamento.meioPagamento` fica sempre vazio na
      // simulação — o meio de pagamento real vem da lista
      // `meiosPagamento` no nível raiz da resposta (documentado como
      // obrigatório pro /efetivar).
      _meioPagamentoId: meioPagamentoId,
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
          // Best-effort: nome do campo não confirmado em documentação
          // pra esse endpoint especificamente (só confirmado na resposta
          // da simulação). Se não vier, fica undefined e a tela não
          // mostra nada — não quebra.
          diasAtraso: c.diasAtraso,
        })),
      };
    },

    /**
     * Lista as negociações (modelos) configuradas na conta.
     *
     * Busca duas vezes e une o resultado (por id) — o usuário confirmou
     * que a listagem às vezes omite uma negociação que está ativa de
     * verdade no CobranSaaS (instabilidade do lado deles). Buscar 2x
     * reduz a chance de perder uma negociação real por causa disso, sem
     * mudar nem calcular nada — só junta o que veio nas duas tentativas.
     */
    async listarNegociacoesDisponiveis() {
      async function buscar() {
        const resposta = await chamarComAutenticacao({ method: 'GET', path: '/api/assessorias/negociacoes' });
        return resposta.content || resposta || [];
      }

      const [primeira, segunda] = await Promise.all([buscar(), buscar().catch(() => [])]);

      const porId = new Map();
      [...primeira, ...segunda].forEach((n) => porId.set(n.id, n));
      return Array.from(porId.values());
    },

    /**
     * Simula cada negociação disponível pro cliente, seguindo o fluxo de
     * duas etapas definido pela Valoris (documento "Fluxo correto de
     * simulação em duas etapas"):
     *
     * 1) Simulação BASE — só pra descobrir o que o CobranSaaS permite:
     *    desconto máximo de principal por parcela (descontoPrincipalMax),
     *    janelas de data (dataEmissaoMin/Max, dataVencimentoMin/Max) e
     *    demais limites por opção de parcelamento. Essa resposta NUNCA é
     *    mostrada ao cliente.
     * 2) Simulação FINAL — pede ao CobranSaaS pra recalcular usando as
     *    datas comerciais da Valoris (entrada/à vista = dataEmissaoMin +
     *    3 dias úteis; 1ª parcela real = entrada + 30 dias corridos,
     *    sempre limitado às janelas informadas no passo 1) E o desconto
     *    máximo já descoberto. É só essa resposta — com valores, datas e
     *    centavos 100% calculados pelo CobranSaaS — que vira proposta
     *    pro cliente. Nada aqui é recalculado por nós.
     */
    async listarPropostas(clienteId) {
      const negociacoes = await this.listarNegociacoesDisponiveis();

      const diagnostico = [];

      async function simular(corpo) {
        return chamarComAutenticacao({
          method: 'POST',
          path: '/api/assessorias/acordos/simular',
          headers: { 'Content-Type': 'application/json' },
          body: corpo,
        });
      }

      const resultados = await Promise.all(
        negociacoes.map(async (negociacao) => {
          const corpoBase = { cliente: clienteId, negociacao: negociacao.id };
          try {
            // 1) Simulação base — descobre o desconto disponível. Pra
            // negociações "assessoria manual" (como "Acordo"), essa
            // resposta pode vir com `parcelamentos` VAZIO — as janelas de
            // data só aparecem depois que o desconto é aplicado (passo
            // 1.5 abaixo).
            const base = await simular(corpoBase);

            const parcelasComDesconto = (base.parcelas || [])
              .filter((p) => Number(p.descontoPrincipalMax) > 0)
              .map((p) => ({ parcela: p.parcela, descontoPrincipal: Number(p.descontoPrincipalMax) }));

            // 1.5) Se há desconto, aplica ele numa simulação intermediária
            // — só assim as janelas de data (dataEmissaoMin/Max etc)
            // ficam disponíveis pra negociações que exigem isso. Sem
            // desconto, a base já serve de referência pras janelas.
            const baseParaDatas =
              parcelasComDesconto.length > 0
                ? await simular({ ...corpoBase, parcelas: parcelasComDesconto })
                : base;

            const parcelamentosComData = (baseParaDatas.parcelamentos || [])
              .filter((p) => p.habilitado !== false)
              .map((p) => {
                const numParcelas = Number(p.numeroParcelas) || 0;
                const baseParaEntrada = p.dataEmissaoMin || baseParaDatas.dataOperacao;
                const dataEntradaDesejada = paraIso(somarDiasUteis(paraData(baseParaEntrada), 3));
                const dataEmissaoFinal = limitarIntervalo(dataEntradaDesejada, p.dataEmissaoMin, p.dataEmissaoMax);
                const dataVencimentoFinal =
                  numParcelas === 0
                    ? dataEmissaoFinal
                    : limitarIntervalo(
                        paraIso(somarDiasCorridos(paraData(dataEmissaoFinal), 30)),
                        p.dataVencimentoMin,
                        p.dataVencimentoMax
                      );
                return { numeroParcelas: numParcelas, dataEmissao: dataEmissaoFinal, dataVencimento: dataVencimentoFinal };
              });

            // 2) Simulação final — datas comerciais da Valoris + desconto
            // máximo, juntos. É essa resposta que vira proposta.
            const corpoFinal = { ...corpoBase, parcelamentos: parcelamentosComData };
            if (parcelasComDesconto.length > 0) corpoFinal.parcelas = parcelasComDesconto;

            const respostaFinal = await simular(corpoFinal);

            diagnostico.push({
              negociacaoId: negociacao.id,
              negociacaoNome: negociacao.nome || negociacao.descricao,
              ok: true,
              descontoDisponivel: parcelasComDesconto.length > 0,
              corpoEnviado: corpoFinal,
              parcelamentosGerados: (respostaFinal.parcelamentos || []).filter((p) => p.habilitado !== false).length,
              valorDivida: respostaFinal.valorDivida,
              // Resposta completa da 2ª simulação, sem cortar nada —
              // todas as datas mín/máx, descontos mín/máx, taxas etc, do
              // jeito que o CobranSaaS devolveu.
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
        const meioPagamentoId = (resposta.meiosPagamento || [])[0]?.id;
        (resposta.parcelamentos || [])
          .filter((p) => p.habilitado !== false)
          .forEach((parcelamento) => {
            const proposta = mapearParcelamentoParaProposta(negociacoes[i].id, parcelamento, meioPagamentoId);
            // Guardado pra reaplicar o mesmo desconto na hora de efetivar
            // (ver confirmarAcordo) — sem isso o acordo seria criado sem
            // o desconto que foi mostrado ao cliente.
            proposta._parcelasComDesconto = parcelasComDesconto;
            propostas.push(proposta);
          });
      });

      // Quando mais de uma negociação gera uma proposta pro mesmo
      // "formato" de pagamento (ex: as duas oferecem 2x), isso pareceria
      // duplicata pro cliente — mantemos só a de menor valor total
      // (a melhor oferta), sem fixar no código qual negociação "ganha".
      const melhoresPorFormato = new Map();
      propostas.forEach((proposta) => {
        const formato =
          proposta.tipo === 'a_vista' ? 'avista' : `parcelado_${(proposta.parcelas || []).length}`;
        const atual = melhoresPorFormato.get(formato);
        if (!atual || Number(proposta.valorTotal) < Number(atual.valorTotal)) {
          melhoresPorFormato.set(formato, proposta);
        }
      });
      const propostasSemDuplicata = Array.from(melhoresPorFormato.values());

      return {
        valorAtualizadoContrato,
        diasAtraso,
        propostas: propostasSemDuplicata,
        diagnostico: { totalNegociacoesConfiguradas: negociacoes.length, tentativas: diagnostico },
      };
    },

    /**
     * Efetiva o acordo de verdade — POST /api/acordos/efetivar.
     *
     * Regra fixa: reutiliza EXATAMENTE o que a simulação já devolveu
     * quando as propostas foram mostradas ao cliente (guardado em
     * `proposta._parcelamentoBruto` e `proposta._parcelasComDesconto` —
     * a "sessão" daquela negociação) — nunca simula de novo, nunca
     * reconstrói nem recalcula nenhum valor. O `parcelamento` do
     * /efetivar é montado copiando os campos que ele exige (documentados
     * em Efetivar_Acordo.pdf) diretamente do que veio no /simular.
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
        // No /efetivar, todo campo de desconto da Parcela é obrigatório
        // (diferente do /simular, onde eram opcionais) — completamos com
        // 0 os que não usamos.
        // IMPORTANTE (confirmado pelo usuário comparando com a simulação
        // real): `valorDesconto` NÃO é igual a `descontoPrincipal` — são
        // campos independentes. Quando o desconto é aplicado por
        // categoria (principal, como aqui), a simulação real devolve
        // valorDesconto = 0. Nunca copiar/somar um no outro.
        corpo.parcelas = proposta._parcelasComDesconto.map((p) => ({
          parcela: p.parcela,
          descontoPrincipal: Number(p.descontoPrincipal) || 0,
          descontoJuros: 0,
          descontoPermanencia: 0,
          descontoMora: 0,
          descontoMulta: 0,
          descontoOutros: 0,
          valorDesconto: 0,
        }));
      }

      try {
        return await chamarComAutenticacao({
          method: 'POST',
          path: '/api/assessorias/acordos/efetivar',
          headers: { 'Content-Type': 'application/json' },
          body: corpo,
        });
      } catch (erro) {
        erro.corpoEnviado = corpo;
        throw erro;
      }
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

    /**
     * Lista os acordos ATIVOS de um cliente — nunca decidido localmente,
     * sempre consultado ao vivo. Situações reais confirmadas pelo
     * usuário pra negociações do tipo "Acordo": PENDENTE (aguardando o
     * 1º pagamento/liquidação à vista) e PARCIAL (parcelado com algum
     * pagamento já feito). NÃO inclui NAO_CUMPRIDO (acordo quebrado —
     * nesse caso o cliente deve ver a negociação de novo) nem CANCELADO
     * nem LIQUIDADO (já quitado).
     */
    async getActiveAgreements(clienteId) {
      const resposta = await chamarComAutenticacao({
        method: 'GET',
        path: `/api/assessorias/acordos?cliente=${clienteId}`,
      });
      const acordos = resposta.content || resposta || [];
      return acordos.filter((a) => a.situacao === 'PENDENTE' || a.situacao === 'PARCIAL');
    },

    /**
     * Detalhe completo de um acordo — parcelas e boletos de cada parcela,
     * exatamente como o CobranSaaS devolve (GET /acordos/{id}, com
     * selector pra trazer parcelas e os boletos de cada parcela numa
     * chamada só).
     */
    async getAgreementDetails(acordoId) {
      return chamarComAutenticacao({
        method: 'GET',
        path: `/api/assessorias/acordos/${acordoId}?selector=parcelas,parcelas.boletos`,
      });
    },

    /**
     * PDF do boleto de uma parcela específica — devolve os bytes crus,
     * sem interpretar. O nome do arquivo é fixo (o CobranSaaS não parece
     * se importar com o valor, mas a documentação exige um segmento na
     * URL).
     */
    async getInstallmentBoletoPdf(acordoId, parcelaId) {
      return chamarComAutenticacaoBinario({
        method: 'GET',
        path: `/api/assessorias/acordos/${acordoId}/${parcelaId}/boleto.pdf`,
      });
    },
  };
}

module.exports = { criarCobranSaasClient };
