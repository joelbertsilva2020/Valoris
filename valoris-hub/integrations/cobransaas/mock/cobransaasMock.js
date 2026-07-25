/**
 * Mock local do CobranSaaS — versão 2 (Portal do Cliente completo).
 *
 * Simula, para o parceiro "nosso_pay", o que a API real do CobranSaaS
 * devolveria em cada etapa da jornada: contratos por CPF, propostas de
 * negociação (à vista e parceladas, com vencimentos), efetivação de acordo,
 * e consulta ao vivo do status do acordo e de cada parcela.
 *
 * O estado do "acordo" fica em memória (objeto do módulo) só para o MVP
 * mockado — isso é reiniciado toda vez que o servidor reinicia. Quando a
 * integração real existir, tudo isso deixa de existir e quem manda é o
 * CobranSaaS de verdade.
 *
 * Nenhum cálculo de parcela/juros/desconto é feito pelo Valoris Hub em
 * lugar nenhum — os valores abaixo já vêm "prontos", simulando o que a
 * API devolveria.
 */

function diasEntre(dataA, dataB) {
  const ms = new Date(dataB) - new Date(dataA);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function somarDias(dataBaseIso, dias) {
  const data = new Date(dataBaseIso);
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

function atraso(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// -----------------------------------------------------------------------------
// Base de dados fake, por CPF. Cada CPF tem um ou mais contratos com o
// parceiro "nosso_pay". `acordo` começa nulo e é preenchido ao confirmar.
// -----------------------------------------------------------------------------
const hoje = new Date().toISOString().slice(0, 10);

const baseFake = {
  '11122233396': {
    nome: 'Cliente Exemplo Um',
    contratos: [
      {
        id: 'contrato_001',
        parceiroSlug: 'nosso_pay',
        numero: 'NP-2024-0088',
        descricao: 'Cartão de crédito Nosso Pay',
        valorAtualizado: 5320.4,
        acordo: null,
      },
    ],
  },
  '55566677720': {
    nome: 'Cliente Exemplo Dois',
    contratos: [
      {
        id: 'contrato_002',
        parceiroSlug: 'nosso_pay',
        numero: 'NP-2023-1147',
        descricao: 'Cartão de crédito Nosso Pay',
        valorAtualizado: 1912.75,
        acordo: null,
      },
    ],
  },
};

function encontrarContrato(contratoId) {
  for (const cpf of Object.keys(baseFake)) {
    const contrato = baseFake[cpf].contratos.find((c) => c.id === contratoId);
    if (contrato) return { cpf, contrato };
  }
  return null;
}

function calcularStatusParcela(vencimentoIso, paga) {
  if (paga) return 'paga';
  const diff = diasEntre(hoje, vencimentoIso);
  if (diff < 0) return 'em_atraso';
  if (diff === 0) return 'vence_hoje';
  return 'a_vencer';
}

function criarCobranSaasMock() {
  return {
    async testarConexao() {
      await atraso(100);
      return { status: 'ok', modo: 'mock', tenant: 'nosso_pay' };
    },

    /**
     * Busca todos os contratos de um CPF nos parceiros integrados.
     * No MVP só "nosso_pay" está integrado.
     */
    async buscarContratosPorCpf(cpf) {
      await atraso(150);
      const registro = baseFake[cpf];
      if (!registro) return { nome: null, contratos: [] };

      return {
        nome: registro.nome,
        contratos: registro.contratos.map((c) => ({
          id: c.id,
          parceiroSlug: c.parceiroSlug,
          numero: c.numero,
          descricao: c.descricao,
          valorAtualizado: c.valorAtualizado,
        })),
      };
    },

    /**
     * Lista as propostas de negociação para um contrato específico.
     * Formato já simulando o que o CobranSaaS devolveria: à vista e
     * parcelado, com vencimentos de entrada e de cada parcela.
     */
    async listarPropostas(contratoId) {
      await atraso(200);
      const achado = encontrarContrato(contratoId);
      if (!achado) {
        const erro = new Error('Contrato não encontrado');
        erro.status = 404;
        throw erro;
      }

      const valorBase = achado.contrato.valorAtualizado;

      const propostas = [
        {
          id: `${contratoId}_avista`,
          tipo: 'a_vista',
          valorTotal: Math.round(valorBase * 0.8 * 100) / 100,
          vencimentoMaximo: somarDias(hoje, 10),
        },
        {
          id: `${contratoId}_parc6`,
          tipo: 'parcelado',
          valorTotal: Math.round(valorBase * 0.96 * 100) / 100,
          entrada: {
            valor: Math.round(valorBase * 0.16 * 100) / 100,
            vencimento: somarDias(hoje, 10),
          },
          parcelas: Array.from({ length: 5 }, (_, i) => ({
            numero: i + 1,
            valor: Math.round(((valorBase * 0.8) / 5) * 100) / 100,
            vencimento: somarDias(hoje, 40 + i * 30),
          })),
        },
        {
          id: `${contratoId}_parc12`,
          tipo: 'parcelado',
          valorTotal: Math.round(valorBase * 1.05 * 100) / 100,
          entrada: {
            valor: Math.round(valorBase * 0.1 * 100) / 100,
            vencimento: somarDias(hoje, 10),
          },
          parcelas: Array.from({ length: 12 }, (_, i) => ({
            numero: i + 1,
            valor: Math.round(((valorBase * 0.95) / 12) * 100) / 100,
            vencimento: somarDias(hoje, 40 + i * 30),
          })),
        },
      ];

      return { contratoId, valorAtualizadoContrato: valorBase, propostas };
    },

    /**
     * Efetiva o acordo escolhido. Só a partir daqui o "acordo" passa a
     * existir de fato — nada antes disso cria compromisso algum.
     */
    async confirmarAcordo(contratoId, propostaEscolhida) {
      await atraso(250);
      const achado = encontrarContrato(contratoId);
      if (!achado) {
        const erro = new Error('Contrato não encontrado');
        erro.status = 404;
        throw erro;
      }

      // Nenhuma parcela é marcada como paga por aqui — o Valoris Hub nunca
      // decide isso localmente. O status "paga" só existe quando o
      // CobranSaaS (aqui, o mock simulando ele) de fato informar isso numa
      // consulta futura. Por enquanto, tudo começa como não paga.
      const parcelas =
        propostaEscolhida.tipo === 'a_vista'
          ? [{ numero: 1, valor: propostaEscolhida.valorTotal, vencimento: propostaEscolhida.vencimentoMaximo, paga: false }]
          : [
              { numero: 0, valor: propostaEscolhida.entrada.valor, vencimento: propostaEscolhida.entrada.vencimento, paga: false, rotulo: 'Entrada' },
              ...propostaEscolhida.parcelas.map((p) => ({ ...p, paga: false })),
            ];

      achado.contrato.acordo = {
        id: `acordo_mock_${Date.now()}`,
        status: 'ativo',
        propostaTipo: propostaEscolhida.tipo,
        valorTotal: propostaEscolhida.valorTotal,
        parcelas,
        criadoEm: new Date().toISOString(),
      };

      return {
        acordoId: achado.contrato.acordo.id,
        status: 'ativo',
        valorTotal: propostaEscolhida.valorTotal,
        proximoVencimento: parcelas[0].vencimento,
      };
    },

    /**
     * Consulta ao vivo o status do acordo e de cada parcela. NUNCA usar
     * dado local para decidir se está ativo/cancelado/quitado — é sempre
     * isso aqui (que simula a fonte de verdade do CobranSaaS) que decide.
     */
    async consultarAcordo(contratoId) {
      await atraso(150);
      const achado = encontrarContrato(contratoId);
      if (!achado || !achado.contrato.acordo) {
        return { existe: false };
      }

      const { acordo, numero, descricao, parceiroSlug } = {
        acordo: achado.contrato.acordo,
        numero: achado.contrato.numero,
        descricao: achado.contrato.descricao,
        parceiroSlug: achado.contrato.parceiroSlug,
      };

      return {
        existe: true,
        acordoId: acordo.id,
        status: acordo.status, // ativo | cancelado | quitado
        contrato: { numero, descricao, parceiroSlug },
        valorTotal: acordo.valorTotal,
        parcelas: acordo.parcelas.map((p) => ({
          numero: p.numero,
          rotulo: p.rotulo || `Parcela ${p.numero}`,
          valor: p.valor,
          vencimento: p.vencimento,
          status: calcularStatusParcela(p.vencimento, p.paga),
          boletoUrl: p.paga ? null : `https://boletos.mock.cobransaas.com.br/${acordo.id}/${p.numero}`,
        })),
      };
    },
  };
}

module.exports = { criarCobranSaasMock };
