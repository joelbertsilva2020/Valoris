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
    tenant: process.env.COBRANSAAS_TENANT,
    // Autenticação OAuth2 real (código + token do aplicativo, do painel do CobranSaaS)
    codigoAplicativo: process.env.COBRANSAAS_CODIGO_APLICATIVO,
    tokenAplicativo: process.env.COBRANSAAS_TOKEN_APLICATIVO,
    // Proxy PHP na HostGator — necessário porque o Vercel não tem IP fixo
    proxyUrl: process.env.COBRANSAAS_PROXY_URL,
    proxySecret: process.env.COBRANSAAS_PROXY_SECRET,
  },

  supabase: {
    url: obrigatoria('SUPABASE_URL'),
    serviceRoleKey: obrigatoria('SUPABASE_SERVICE_ROLE_KEY'),
  },
};
