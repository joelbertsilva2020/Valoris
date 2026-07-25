const express = require('express');
const { getCobranSaasService } = require('../services/cobransaasService');
const { getSupabase } = require('../config/supabaseClient');

const router = express.Router();

// GET /status -> confirma que o backend está de pé, que a integração com o
// CobranSaaS (mock ou real) está respondendo, e que o Supabase está acessível.
router.get('/status', async (req, res) => {
  const resultado = { valorisHub: 'ok' };

  try {
    const cobransaas = getCobranSaasService();
    resultado.cobransaas = await cobransaas.testarConexao();
  } catch (erro) {
    resultado.cobransaas = { status: 'falhou', detalhe: erro.message };
  }

  try {
    const supabase = getSupabase();
    // Consulta simples só pra confirmar que a conexão/credenciais funcionam.
    const { error } = await supabase.from('usuarios_internos').select('id').limit(1);
    if (error) throw error;
    resultado.supabase = { status: 'ok' };
  } catch (erro) {
    resultado.supabase = { status: 'falhou', detalhe: erro.message };
  }

  res.json(resultado);
});

module.exports = router;
