const express = require('express');
const portalService = require('../services/portalService');
const { validarCpf } = require('../utils/cpf');

const router = express.Router();

function tratarErro(res, contexto, erro) {
  console.error(`[Portal] Erro em ${contexto}:`, erro.message, erro.detalhe ? JSON.stringify(erro.detalhe) : '');
  const status = erro.status === 404 ? 404 : erro.status === 400 ? 400 : 500;
  res.status(status).json({
    erro:
      status === 404
        ? 'Não encontramos essa informação.'
        : status === 400
        ? erro.message
        : 'Não foi possível concluir agora. Tente novamente em instantes.',
    // Fase de testes: manda o detalhe real que o CobranSaaS devolveu,
    // pra não precisar caçar log toda vez que algo falha. Tirar antes do
    // lançamento pra clientes finais.
    detalhe: erro.detalhe,
    corpoEnviado: erro.corpoEnviado,
  });
}

// 1. Tela inicial — consultar CPF em todos os parceiros integrados
router.post('/consultar-cpf', async (req, res) => {
  try {
    const { cpf } = req.body;
    if (!cpf) return res.status(400).json({ erro: 'Informe um CPF.' });
    if (!validarCpf(cpf)) return res.status(400).json({ erro: 'CPF inválido. Confira os números digitados.' });
    const resultado = await portalService.consultarCpf(cpf);
    res.json(resultado);
  } catch (erro) {
    tratarErro(res, 'consultar-cpf', erro);
  }
});

// 2a. Cadastro — primeiro acesso
router.post('/cadastro', async (req, res) => {
  try {
    const { cpf, nome, dataNascimento, email, telefone } = req.body;
    if (!cpf || !nome || !dataNascimento) {
      return res.status(400).json({ erro: 'Nome, CPF e data de nascimento são obrigatórios.' });
    }
    if (!validarCpf(cpf)) return res.status(400).json({ erro: 'CPF inválido.' });
    const resultado = await portalService.cadastrarCliente({ cpf, nome, dataNascimento, email, telefone });
    res.json(resultado);
  } catch (erro) {
    tratarErro(res, 'cadastro', erro);
  }
});

// 2b. Validação de retorno — CPF + data de nascimento
router.post('/validar-retorno', async (req, res) => {
  try {
    const { cpf, dataNascimento } = req.body;
    if (!cpf || !dataNascimento) {
      return res.status(400).json({ erro: 'Informe CPF e data de nascimento.' });
    }
    const resultado = await portalService.validarRetorno(cpf, dataNascimento);
    res.json(resultado);
  } catch (erro) {
    tratarErro(res, 'validar-retorno', erro);
  }
});

// 3. Lista de contratos (cada contrato já vem com clienteId)
router.post('/contratos', async (req, res) => {
  try {
    const { cpf } = req.body;
    if (!cpf) return res.status(400).json({ erro: 'Informe um CPF.' });
    const resultado = await portalService.listarContratos(cpf);
    res.json(resultado);
  } catch (erro) {
    tratarErro(res, 'contratos', erro);
  }
});

// 4. Propostas — simuladas em cima do clienteId
router.post('/propostas', async (req, res) => {
  try {
    const { clienteId, contratoId, valorOriginal, cpf } = req.body;
    if (!clienteId) return res.status(400).json({ erro: 'Cliente não informado.' });
    const resultado = await portalService.listarPropostas({ clienteId, contratoId, valorOriginal, cpf });
    res.json(resultado);
  } catch (erro) {
    tratarErro(res, 'propostas', erro);
  }
});

// Registrar escolha da proposta (antes da confirmação) — só telemetria
router.post('/escolher-proposta', async (req, res) => {
  try {
    const { clienteId, contratoId, propostaId, cpf } = req.body;
    await portalService.registrarEscolhaProposta({ clienteId, contratoId, propostaId, cpf });
    res.json({ ok: true });
  } catch (erro) {
    tratarErro(res, 'escolher-proposta', erro);
  }
});

// 6/7. Confirmar Acordo — único ponto que cria o acordo de verdade
router.post('/confirmar-acordo', async (req, res) => {
  try {
    const { clienteId, contratoId, propostaEscolhida, canal, email, cpf } = req.body;
    if (!clienteId || !propostaEscolhida) {
      return res.status(400).json({ erro: 'Dados insuficientes para confirmar o acordo.' });
    }
    const resultado = await portalService.confirmarAcordo({
      clienteId,
      contratoId,
      propostaEscolhida,
      canal,
      email,
      cpf,
    });
    res.json(resultado);
  } catch (erro) {
    tratarErro(res, 'confirmar-acordo', erro);
  }
});

// 9. Meu Acordo (visão simples/legada) — sempre ao vivo, pelo clienteId
router.post('/meu-acordo', async (req, res) => {
  try {
    const { clienteId } = req.body;
    if (!clienteId) return res.status(400).json({ erro: 'Cliente não informado.' });
    const resultado = await portalService.consultarMeuAcordo(clienteId);
    res.json(resultado);
  } catch (erro) {
    tratarErro(res, 'meu-acordo', erro);
  }
});

// 9b. Acordos ativos — nova ramificação do fluxo pós-login
router.post('/acordos-ativos', async (req, res) => {
  try {
    const { clienteId } = req.body;
    if (!clienteId) return res.status(400).json({ erro: 'Cliente não informado.' });
    const resultado = await portalService.listarAcordosAtivos(clienteId);
    res.json(resultado);
  } catch (erro) {
    tratarErro(res, 'acordos-ativos', erro);
  }
});

// Detalhe de um acordo específico (parcelas + boletos), com validação de
// posse (o acordo precisa pertencer ao clienteId informado).
router.post('/acordo-detalhe', async (req, res) => {
  try {
    const { acordoId, clienteId } = req.body;
    if (!acordoId || !clienteId) return res.status(400).json({ erro: 'Dados insuficientes.' });
    const resultado = await portalService.consultarDetalheAcordo(acordoId, clienteId);
    res.json(resultado);
  } catch (erro) {
    tratarErro(res, 'acordo-detalhe', erro);
  }
});

// PDF do boleto de uma parcela — devolve o binário direto (não é JSON).
router.post('/acordo-boleto', async (req, res) => {
  try {
    const { acordoId, parcelaId, clienteId } = req.body;
    if (!acordoId || !parcelaId || !clienteId) {
      return res.status(400).json({ erro: 'Dados insuficientes.' });
    }
    const pdfBuffer = await portalService.buscarBoletoParcela(acordoId, parcelaId, clienteId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="boleto.pdf"');
    res.send(pdfBuffer);
  } catch (erro) {
    tratarErro(res, 'acordo-boleto', erro);
  }
});

// 10. Próximos acessos — decide para onde mandar o cliente
router.post('/proximo-passo', async (req, res) => {
  try {
    const { cpf, contratos } = req.body;
    if (!cpf || !contratos || contratos.length === 0) {
      return res.status(400).json({ erro: 'Dados insuficientes.' });
    }
    const resultado = await portalService.decidirProximoPasso(cpf, contratos);
    res.json(resultado);
  } catch (erro) {
    tratarErro(res, 'proximo-passo', erro);
  }
});

// Telemetria de abandono — chamado via navigator.sendBeacon, não precisa
// de resposta rica.
router.post('/abandono', async (req, res) => {
  try {
    const { cpf, etapa } = req.body;
    await portalService.registrarAbandono(cpf, etapa);
    res.status(204).end();
  } catch (erro) {
    console.error('[Portal] Erro ao registrar abandono:', erro.message);
    res.status(204).end();
  }
});

module.exports = router;
