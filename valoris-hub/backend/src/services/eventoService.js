/**
 * Registro de eventos da jornada do cliente no Portal (invisível para o
 * cliente). Alimenta o ERP no futuro para medir conversão/abandono, sem
 * precisar mudar a estrutura do Portal depois.
 *
 * Falha ao registrar um evento NUNCA deve derrubar a jornada do cliente —
 * por isso os erros aqui são só logados, nunca propagados.
 */

const { getSupabase } = require('../config/supabaseClient');

async function registrarEvento(tipo, { cpf = null, clienteId = null, detalhe = null } = {}) {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('eventos_portal').insert({
      tipo,
      cpf,
      cliente_id: clienteId,
      detalhe,
    });
    if (error) throw error;
  } catch (erro) {
    console.error(`[Eventos] Falha ao registrar evento "${tipo}":`, erro.message);
  }
}

module.exports = { registrarEvento };
