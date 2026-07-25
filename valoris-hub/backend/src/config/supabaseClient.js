/**
 * Ponto único de acesso ao Supabase dentro do backend.
 *
 * Usa a Service Role Key (não a chave pública/anon) porque quem fala com o
 * Supabase é sempre o backend — o frontend nunca acessa o banco direto.
 * Por isso o RLS (Row Level Security) do schema.sql não bloqueia nada aqui.
 */

const { createClient } = require('@supabase/supabase-js');
const config = require('../config/env');

let instancia = null;

function getSupabase() {
  if (instancia) return instancia;

  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error(
      '[Supabase] SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos no .env'
    );
  }

  instancia = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false },
  });

  return instancia;
}

module.exports = { getSupabase };
