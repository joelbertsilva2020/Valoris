require('dotenv').config();

function obrigatoria(nome) {
  const valor = process.env[nome];
  if (!valor) {
    console.warn(`[config] Variável de ambiente ausente: ${nome}`);
  }
  return valor;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  porta: Number(process.env.PORT) || 3333,

  cobransaas: {
    usarMock: process.env.COBRANSAAS_USE_MOCK !== 'false', // true por padrão
    baseURL: process.env.COBRANSAAS_BASE_URL,
    tenant: process.env.COBRANSAAS_TENANT,
    appToken: process.env.COBRANSAAS_APP_TOKEN,
  },

  supabase: {
    url: obrigatoria('SUPABASE_URL'),
    serviceRoleKey: obrigatoria('SUPABASE_SERVICE_ROLE_KEY'),
  },
};
