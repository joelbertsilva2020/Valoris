/**
 * Serviço central do Portal do Cliente.
 *
 * Regras de negócio impostas pela especificação (não violar):
 * - Nenhum acordo é criado ao escolher uma proposta — só na confirmação final.
 * - O Percentual de Economia é o único cálculo feito pelo Valoris Hub,
 *   sempre em cima de valores que o CobranSaaS já retornou.
 * - Status de acordo/parcelas é sempre consultado ao vivo no CobranSaaS,
 *   nunca decidido por dado local.
 *
 * CORREÇÃO (integração real v5): a API do CobranSaaS identifica negociação,
 * simulação, efetivação e consulta de acordo pelo CLIENTE (clienteId), não
 * pelo contrato. O contratoId continua existindo só pra exibição/telemetria
 * — todas as chamadas ao cobransaasClient usam clienteId.
 */

const { getCobranSaasService } = require('./cobransaasService');
const { getSupabase } = require('../config/supabaseClient');
const { registrarEvento } = require('./eventoService');
const { comTimeout } = require('./comTimeout');

const TIMEOUT_MS = 10000;

function calcularPercentualEconomia(valorAtualizado, valorTotalProposta) {
  if (!valorAtualizado || valorAtualizado <= 0) return null;
  const economia = valorAtualizado - valorTotalProposta;
  return Math.round((economia / valorAtualizado) * 100 * 100) / 100;
}

function limparCpf(cpf) {
  return String(cpf || '').replace(/\D/g, '');
}

// ---------------------------------------------------------------------------
// 1. Tela inicial — consultar CPF em todos os parceiros integrados
// ---------------------------------------------------------------------------
async function consultarCpf(cpfBruto) {
  const cpf = limparCpf(cpfBruto);
  const cobransaas = getCobranSaasService();
  const supabase = getSupabase();

  await registrarEvento('cpf_consultado', { cpf });

  const resultado = await comTimeout(
    cobransaas.buscarContratosPorCpf(cpf),
    TIMEOUT_MS,
    'CobranSaaS (buscar contratos)'
  );

  if (!resultado.contratos || resultado.contratos.length === 0) {
    await registrarEvento('cpf_nao_encontrado', { cpf });
    return { cpf, encontrado: false };
  }

  await registrarEvento('cpf_encontrado', { cpf, detalhe: { quantidadeContratos: resultado.contratos.length } });

  const { data: clienteExistente } = await comTimeout(
    supabase.from('clientes').select('id, nome').eq('cpf', cpf).maybeSingle(),
    TIMEOUT_MS,
    'Supabase (checar cliente)'
  );

  return {
    cpf,
    encontrado: true,
    clienteExistente: Boolean(clienteExistente),
  };
}

// ---------------------------------------------------------------------------
// 2. Validação do cliente — cadastro (1º acesso) ou CPF+nascimento (retorno)
// ---------------------------------------------------------------------------
async function cadastrarCliente({ cpf, nome, dataNascimento, email, telefone }) {
  const supabase = getSupabase();
  const cpfLimpo = limparCpf(cpf);

  const { data: cliente, error } = await comTimeout(
    supabase
      .from('clientes')
      .upsert(
        {
          cpf: cpfLimpo,
          nome,
          data_nascimento: dataNascimento,
          email: email || null,
          telefone: telefone || null,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: 'cpf' }
      )
      .select()
      .single(),
    TIMEOUT_MS,
    'Supabase (cadastrar cliente)'
  );

  if (error) throw error;

  await registrarEvento('cadastro_realizado', { cpf: cpfLimpo, clienteId: cliente.id });

  return { clienteId: cliente.id, nome: cliente.nome };
}

async function validarRetorno(cpfBruto, dataNascimento) {
  const supabase = getSupabase();
  const cpf = limparCpf(cpfBruto);

  const { data: cliente, error } = await comTimeout(
    supabase.from('clientes').select('id, nome, data_nascimento').eq('cpf', cpf).maybeSingle(),
    TIMEOUT_MS,
    'Supabase (validar retorno)'
  );

  if (error) throw error;
  if (!cliente) return { valido: false };

  const valido = cliente.data_nascimento === dataNascimento;
  await registrarEvento('validacao_retorno', { cpf, clienteId: cliente.id, detalhe: { valido } });

  return valido ? { valido: true, clienteId: cliente.id, nome: cliente.nome } : { valido: false };
}

// ---------------------------------------------------------------------------
// 3. Lista de contratos
//    Cada contrato já vem com o clienteId do CobranSaaS (ver
//    cobransaasClient.buscarContratosPorCpf) — o front carrega esse
//    clienteId pro resto da jornada.
// ---------------------------------------------------------------------------
async function listarContratos(cpfBruto) {
  const cpf = limparCpf(cpfBruto);
  const cobransaas = getCobranSaasService();

  const resultado = await comTimeout(
    cobransaas.buscarContratosPorCpf(cpf),
    TIMEOUT_MS,
    'CobranSaaS (listar contratos)'
  );

  return {
    nome: resultado.nome,
    contratos: (resultado.contratos || []).map((c) => ({
      ...c,
      mensagem: 'Encontramos uma oportunidade especial para regularização deste contrato.',
    })),
  };
}

// ---------------------------------------------------------------------------
// 4. Propostas — simuladas em cima do CLIENTE, não do contrato
// ---------------------------------------------------------------------------
async function listarPropostas({ clienteId, contratoId, cpf }) {
  if (!clienteId) {
    const erro = new Error('clienteId é obrigatório para simular propostas.');
    erro.status = 400;
    throw erro;
  }

  const cobransaas = getCobranSaasService();

  const resposta = await comTimeout(
    cobransaas.listarPropostas(clienteId),
    TIMEOUT_MS,
    'CobranSaaS (listar propostas)'
  );

  const propostasComEconomia = resposta.propostas.map((proposta) => ({
    ...proposta,
    percentualEconomia: calcularPercentualEconomia(resposta.valorAtualizadoContrato, proposta.valorTotal),
  }));

  await registrarEvento('proposta_visualizada', { cpf, detalhe: { clienteId, contratoId } });

  return {
    clienteId,
    contratoId,
    valorAtualizadoContrato: resposta.valorAtualizadoContrato,
    propostas: propostasComEconomia,
    // Temporário: só ajuda a investigar por que um cliente não tem
    // propostas. Remover depois que o motivo for confirmado.
    diagnostico: propostasComEconomia.length === 0 ? resposta.diagnostico : undefined,
  };
}

async function registrarEscolhaProposta({ clienteId, contratoId, propostaId, cpf }) {
  await registrarEvento('proposta_escolhida', { cpf, detalhe: { clienteId, contratoId, propostaId } });
}

// ---------------------------------------------------------------------------
// 6/7. Confirmação — grava o canal de contato escolhido e só então efetiva
//      o acordo de verdade no CobranSaaS. Único ponto que cria o acordo.
// ---------------------------------------------------------------------------
async function confirmarAcordo({ clienteId, contratoId, propostaEscolhida, canal, email, cpf }) {
  if (!clienteId || !propostaEscolhida) {
    const erro = new Error('Dados insuficientes para confirmar o acordo.');
    erro.status = 400;
    throw erro;
  }

  const cobransaas = getCobranSaasService();
  const supabase = getSupabase();

  // Guarda o e-mail de contato escolhido nessa confirmação — não bloqueia
  // a efetivação se falhar, só loga.
  if (email) {
    const cpfLimpo = limparCpf(cpf);
    await supabase
      .from('clientes')
      .update({ email, atualizado_em: new Date().toISOString() })
      .eq('cpf', cpfLimpo)
      .then(null, (erro) => console.error('[Portal] Falha ao atualizar e-mail de contato:', erro.message));
  }

  const resultado = await comTimeout(
    cobransaas.confirmarAcordo(clienteId, propostaEscolhida),
    TIMEOUT_MS,
    'CobranSaaS (efetivar acordo)'
  );

  await registrarEvento('acordo_efetivado', {
    cpf,
    detalhe: { clienteId, contratoId, canal, acordoId: resultado.acordoId || resultado.id },
  });

  return resultado;
}

// ---------------------------------------------------------------------------
// 9. Meu Acordo — sempre consultado ao vivo, pelo cliente
// ---------------------------------------------------------------------------
async function consultarMeuAcordo(clienteId) {
  const cobransaas = getCobranSaasService();

  return comTimeout(
    cobransaas.consultarAcordo(clienteId),
    TIMEOUT_MS,
    'CobranSaaS (consultar acordo)'
  );
}

// ---------------------------------------------------------------------------
// 10. Próximos acessos — decide pra onde mandar o cliente
// ---------------------------------------------------------------------------
async function decidirProximoPasso(cpfBruto, contratos) {
  const cobransaas = getCobranSaasService();
  const cpf = limparCpf(cpfBruto);

  // MVP: só um parceiro/contrato por CPF. Verifica o primeiro contrato.
  const contrato = contratos[0];
  const acordo = await comTimeout(
    cobransaas.consultarAcordo(contrato.clienteId),
    TIMEOUT_MS,
    'CobranSaaS (consultar acordo — retorno)'
  );

  if (acordo.existe && acordo.status === 'ativo') {
    return { destino: 'meu-acordo', clienteId: contrato.clienteId, contratoId: contrato.id };
  }
  return { destino: 'negociacao', clienteId: contrato.clienteId, contratoId: contrato.id };
}

async function registrarAbandono(cpf, etapa) {
  await registrarEvento('abandono_jornada', { cpf: limparCpf(cpf), detalhe: { etapa } });
}

module.exports = {
  consultarCpf,
  cadastrarCliente,
  validarRetorno,
  listarContratos,
  listarPropostas,
  registrarEscolhaProposta,
  confirmarAcordo,
  consultarMeuAcordo,
  decidirProximoPasso,
  registrarAbandono,
};
