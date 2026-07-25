/**
 * Executa uma Promise com um limite de tempo. Se estourar o tempo, rejeita
 * com um erro claro em vez de deixar a requisição pendurada para sempre.
 * Usado em chamadas ao Supabase e ao CobranSaaS, que dependem de rede.
 */
function comTimeout(promessa, ms, rotulo) {
  let temporizador;

  const timeoutPromise = new Promise((_, reject) => {
    temporizador = setTimeout(() => {
      reject(new Error(`[Timeout] ${rotulo} não respondeu em ${ms / 1000}s.`));
    }, ms);
  });

  return Promise.race([promessa, timeoutPromise]).finally(() => clearTimeout(temporizador));
}

module.exports = { comTimeout };
