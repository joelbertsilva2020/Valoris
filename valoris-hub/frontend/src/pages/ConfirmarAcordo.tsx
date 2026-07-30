import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { usePortal } from '../state/PortalContext';
import { chamarApi } from '../lib/api';
import { formatarMoeda } from '../lib/cpf';
import PortalPainel from '../components/PortalPainel';
import BotaoMarca from '../components/BotaoMarca';

export default function ConfirmarAcordo() {
  const navigate = useNavigate();
  const {
    cpf, contratoAtual, propostaEscolhida,
    canalConfirmacao, setCanalConfirmacao,
    emailConfirmacao, setEmailConfirmacao,
    setAcordoConfirmado,
  } = usePortal();

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!contratoAtual || !propostaEscolhida) {
    navigate('/contratos');
    return null;
  }

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    if (!emailConfirmacao) {
      setErro('Informe um e-mail válido.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const resultado = await chamarApi<{ acordoId?: string; id?: string; linhaDigitavel?: string; urlBoleto?: string }>(
        '/confirmar-acordo',
        {
          clienteId: contratoAtual!.clienteId,
          contratoId: contratoAtual!.id,
          propostaEscolhida,
          canal: canalConfirmacao,
          email: emailConfirmacao,
          cpf,
        }
      );
      setAcordoConfirmado({
        acordoId: resultado.acordoId || resultado.id || '',
        linhaDigitavel: resultado.linhaDigitavel,
        urlBoleto: resultado.urlBoleto,
      });
      navigate('/sucesso');
    } catch (e: any) {
      setErro(e.message || 'Não foi possível confirmar o acordo agora.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PortalPainel rotulo="Última etapa" titulo="Confirmar Acordo">
      <p className="text-claro-suave text-sm mb-6">
        Para finalizar o acordo, preencha os campos abaixo e confirme.
      </p>

      <form onSubmit={confirmar} className="max-w-md space-y-5">
        <div>
          <label className="block text-sm font-medium text-claro-texto mb-1.5">Selecione uma opção</label>
          <select
            value={canalConfirmacao}
            onChange={(e) => setCanalConfirmacao(e.target.value)}
            className="w-full bg-claro-superficie border border-claro-linha rounded-lg px-3.5 py-2.5 text-claro-texto focus:outline-none focus:border-roxo"
          >
            <option value="email">Email</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-claro-texto mb-1.5">Informe seu e-mail</label>
          <input
            type="email"
            required
            value={emailConfirmacao}
            onChange={(e) => setEmailConfirmacao(e.target.value)}
            placeholder="seuemail@exemplo.com.br"
            className="w-full bg-claro-superficie border border-claro-linha rounded-lg px-3.5 py-2.5 text-claro-texto placeholder:text-claro-suave focus:outline-none focus:border-roxo"
          />
        </div>

        <div className="bg-claro-superficie border border-claro-linha rounded-lg p-4 flex justify-between items-center text-sm">
          <span className="text-claro-suave">Total do acordo</span>
          <span className="font-mono text-claro-texto text-base">{formatarMoeda(propostaEscolhida.valorTotal)}</span>
        </div>

        {erro && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3.5 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {erro}
          </div>
        )}

        <BotaoMarca full type="submit" disabled={enviando}>
          {enviando ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Confirmando…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ShieldCheck size={16} /> Confirme o acordo
            </span>
          )}
        </BotaoMarca>
      </form>
    </PortalPainel>
  );
}
