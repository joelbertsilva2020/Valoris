/**
 * Serviço central do Portal do Cliente.
 *
 * Regras de negócio impostas pela especificação (não violar):
 * - Nenhum acordo é criado ao escolher uma proposta — só na confirmação final.
 * - A Valoris NUNCA calcula/recalcula parcelas, juros, descontos, tarifas
 *   ou distribuição de centavos — o CobranSaaS é a única fonte de verdade.
 *   O único cálculo próprio é o "Percentual de Economia" (visual) e a
 *   escolha de DATAS COMERCIAIS dentro das janelas que o CobranSaaS libera.
 * - Status de acordo/parcelas é sempre consultado ao vivo no CobranSaaS,
 *   nunca decidido por dado local ou por dado da simulação antiga.
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
// 3. Lista de contratos (cada contrato já vem com clienteId)
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
async function listarPropostas({ clienteId, contratoId, valorOriginal, cpf }) {
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

  // O valor de referência pra calcular a economia vem do próprio contrato
  // (mesmo valor já exibido, confirmado, na tela de Contratos) — mais
  // confiável do que o campo equivalente na resposta da simulação.
  const valorReferencia = valorOriginal ?? resposta.valorAtualizadoContrato;

  const propostasComEconomia = resposta.propostas.map((proposta) => ({
    ...proposta,
    percentualEconomia: calcularPercentualEconomia(valorReferencia, proposta.valorTotal),
  }));

  await registrarEvento('proposta_visualizada', { cpf, detalhe: { clienteId, contratoId } });

  return {
    clienteId,
    contratoId,
    valorAtualizadoContrato: valorReferencia,
    diasAtraso: resposta.diasAtraso,
    propostas: propostasComEconomia,
    // Temporário: só ajuda a investigar a integração com o CobranSaaS.
    // Remover antes do lançamento pra clientes finais.
    diagnostico: resposta.diagnostico,
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

  if (email) {
    const cpfLimpo = limparCpf(cpf);
    await supabase
      .from('clientes')
      .update({ email, atualizado_em: new Date().toISOString() })
      .eq('cpf', cpfLimpo)
      .then(null, (erro) => console.error('[Portal] Falha ao atualizar e-mail de contato:', erro.message));
  }

  try {
    const resultado = await comTimeout(
      cobransaas.confirmarAcordo(clienteId, propostaEscolhida),
      TIMEOUT_MS,
      'CobranSaaS (efetivar acordo)'
    );

    await registrarEvento('acordo_efetivado', {
      cpf,
      detalhe: { clienteId, contratoId, canal, acordoId: resultado.id || resultado.numeroAcordo },
    });

    return resultado;
  } catch (erro) {
    // Fase de testes: repassa o corpo exato enviado, se disponível, pra
    // aparecer na tela sem precisar caçar log.
    if (erro.corpoEnviado) erro.detalhe = { ...(erro.detalhe || {}), corpoEnviado: erro.corpoEnviado };
    throw erro;
  }
}

// ---------------------------------------------------------------------------
// 9. Meu Acordo (visão simples/legada) — sempre consultado ao vivo
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
// 9b. Acordos ativos — nova ramificação do fluxo (cliente que já tem
//     acordo PENDENTE/PARCIAL não deve ver a oferta de negociação de
//     novo). Fonte da verdade sempre o CobranSaaS, nunca dado
//     local/simulação antiga. Sem cache — cada acesso consulta ao vivo.
// ---------------------------------------------------------------------------
async function listarAcordosAtivos(clienteId) {
  if (!clienteId) {
    const erro = new Error('clienteId é obrigatório.');
    erro.status = 400;
    throw erro;
  }
  const cobransaas = getCobranSaasService();
  const resumos = await comTimeout(
    cobransaas.getActiveAgreements(clienteId),
    TIMEOUT_MS,
    'CobranSaaS (acordos ativos)'
  );

  // Enriquece cada acordo com o detalhe completo (parcelas + boletos) —
  // evita a tela precisar fazer uma chamada por acordo depois.
  const acordos = await Promise.all(
    resumos.map((resumo) =>
      comTimeout(cobransaas.getAgreementDetails(resumo.id), TIMEOUT_MS, 'CobranSaaS (detalhe do acordo)').catch(
        () => resumo // se o detalhe falhar, ao menos o resumo básico não se perde
      )
    )
  );

  return { acordos };
}

/**
 * Detalhe completo de um acordo (parcelas + boletos), validando que o
 * acordo pertence de fato ao cliente autenticado antes de devolver
 * qualquer dado.
 *
 * CORREÇÃO: a 1ª versão comparava `acordo.cliente` (que a documentação
 * do CobranSaaS descreve como "Id EXTERNO do cliente") contra o
 * `clienteId` interno que usamos no resto do app — formatos diferentes,
 * a comparação nunca batia e todo acordo real dava "não encontrado".
 * Agora a posse é validada checando se o acordoId está entre os acordos
 * ativos daquele cliente (a própria busca `?cliente=X` no CobranSaaS já
 * filtra por cliente do lado deles).
 */
async function consultarDetalheAcordo(acordoId, clienteId) {
  if (!acordoId || !clienteId) {
    const erro = new Error('Dados insuficientes.');
    erro.status = 400;
    throw erro;
  }
  const cobransaas = getCobranSaasService();

  const acordosDoCliente = await comTimeout(
    cobransaas.getActiveAgreements(clienteId),
    TIMEOUT_MS,
    'CobranSaaS (validar posse do acordo)'
  );
  const pertence = acordosDoCliente.some((a) => String(a.id) === String(acordoId));
  if (!pertence) {
    const erro = new Error('Acordo não encontrado.');
    erro.status = 404;
    throw erro;
  }

  return comTimeout(
    cobransaas.getAgreementDetails(acordoId),
    TIMEOUT_MS,
    'CobranSaaS (detalhe do acordo)'
  );
}

/**
 * PDF do boleto de uma parcela — mesma validação de posse do acordo
 * (via lista de acordos ativos do cliente) antes de buscar o PDF no
 * CobranSaaS. Nunca gera boleto/linha digitável por conta própria; só
 * repassa o PDF que o CobranSaaS já tem registrado.
 */
async function buscarBoletoParcela(acordoId, parcelaId, clienteId) {
  if (!acordoId || !parcelaId || !clienteId) {
    const erro = new Error('Dados insuficientes.');
    erro.status = 400;
    throw erro;
  }
  const cobransaas = getCobranSaasService();

  const acordosDoCliente = await comTimeout(
    cobransaas.getActiveAgreements(clienteId),
    TIMEOUT_MS,
    'CobranSaaS (validar posse do acordo)'
  );
  const pertence = acordosDoCliente.some((a) => String(a.id) === String(acordoId));
  if (!pertence) {
    const erro = new Error('Acordo não encontrado.');
    erro.status = 404;
    throw erro;
  }

  return comTimeout(
    cobransaas.getInstallmentBoletoPdf(acordoId, parcelaId),
    TIMEOUT_MS,
    'CobranSaaS (PDF do boleto)'
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

  const acordosAtivos = await comTimeout(
    cobransaas.getActiveAgreements(contrato.clienteId),
    TIMEOUT_MS,
    'CobranSaaS (acordos ativos — retorno)'
  );

  if (acordosAtivos.length > 0) {
    return { destino: 'acordo-ativo', clienteId: contrato.clienteId, contratoId: contrato.id };
  }
  return { destino: 'contratos', clienteId: contrato.clienteId, contratoId: contrato.id };
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
  listarAcordosAtivos,
  consultarDetalheAcordo,
  buscarBoletoParcela,
  decidirProximoPasso,
  registrarAbandono,
};
