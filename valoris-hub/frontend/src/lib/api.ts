const API_BASE = '/api/portal';

export async function chamarApi<T = any>(caminho: string, corpo: unknown): Promise<T> {
  const controlador = new AbortController();
  const tempoLimite = setTimeout(() => controlador.abort(), 15000);

  try {
    const resposta = await fetch(`${API_BASE}${caminho}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
      signal: controlador.signal,
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      console.error(`[Portal] ${caminho} respondeu ${resposta.status}:`, dados);
      const mensagem = dados.erro || 'Algo deu errado. Tente novamente.';
      const detalhe = dados.detalhe ? ` — detalhe: ${JSON.stringify(dados.detalhe)}` : '';
      const corpoEnviado = dados.corpoEnviado ? ` — enviado: ${JSON.stringify(dados.corpoEnviado)}` : '';
      throw new Error(mensagem + detalhe + corpoEnviado);
    }
    return dados as T;
  } catch (erro: any) {
    if (erro.name === 'AbortError') {
      throw new Error('O servidor demorou demais para responder. Verifique sua conexão e tente novamente.');
    }
    throw erro;
  } finally {
    clearTimeout(tempoLimite);
  }
}

export function enviarAbandono(cpf: string, etapa: string) {
  const dados = JSON.stringify({ cpf, etapa });
  navigator.sendBeacon?.(`${API_BASE}/abandono`, new Blob([dados], { type: 'application/json' }));
}
