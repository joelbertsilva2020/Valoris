import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { usePortal } from '../state/PortalContext';
import { chamarApi } from '../lib/api';
import { formatarMoeda, formatarData } from '../lib/cpf';
import StatusBadge from '../components/StatusBadge';

interface Parcela {
  numero: number;
  rotulo: string;
  valor: number;
  vencimento: string;
  status: string;
  boletoUrl: string | null;
}

interface AcordoResposta {
  existe: boolean;
  acordoId?: string;
  status?: string;
  contrato?: { numero: string; descricao: string };
  valorTotal?: number;
  parcelas?: Parcela[];
}

export default function MeuAcordo() {
  const navigate = useNavigate();
  const { contratoAtual } = usePortal();
  const [acordo, setAcordo] = useState<AcordoResposta | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!contratoAtual) {
      navigate('/');
      return;
    }
    chamarApi<AcordoResposta>('/meu-acordo', { clienteId: contratoAtual.clienteid })
      .then(setAcordo)
      .catch((e) => setErro(e.message));
  }, [contratoAtual]);

  if (!contratoAtual) return null;

  return (
    <div>
      <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-roxo-claro bg-roxo/10 border border-roxo/25 rounded-full px-3 py-1.5 mb-5">
        Meu acordo
      </span>
      <h1 className="font-display font-semibold text-3xl text-texto mb-6">Seu acordo</h1>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      {!acordo && !erro && <p className="text-texto-suave">Carregando…</p>}

      {acordo && !acordo.existe && (
        <p className="text-texto-suave">Nenhum acordo ativo encontrado para este contrato.</p>
      )}

      {acordo?.existe && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-11 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 p-1.5">
              <img src="/parceiros/nosso-pay.png" alt="Nosso Pay" className="max-w-full max-h-full object-contain" />
            </span>
            <span className="text-sm text-texto-suave">Contrato com <strong className="text-texto">Nosso Pay</strong></span>
          </div>

          <div className="card-vidro p-6 mb-8 divide-y divide-linha">
            <Linha rotulo="Situação" valor={acordo.status?.toUpperCase() || ''} />
            <Linha rotulo="Contrato" valor={acordo.contrato?.numero || ''} />
            <Linha rotulo="Parceiro" valor="Nosso Pay" />
            <Linha rotulo="Valor total" valor={formatarMoeda(acordo.valorTotal || 0)} />
          </div>

          <h2 className="font-display font-semibold text-xl text-texto mb-4">Parcelas</h2>
          <div className="space-y-3">
            {acordo.parcelas?.map((parcela) => (
              <div key={parcela.numero} className="card-vidro flex items-center justify-between gap-4 p-5">
                <div className="flex gap-4 items-start">
                  <span className="w-9 h-9 rounded-lg bg-roxo/10 border border-roxo/25 flex items-center justify-center flex-shrink-0">
                    <Receipt size={16} className="text-roxo-claro" />
                  </span>
                  <div>
                    <p className="font-semibold text-texto">{parcela.rotulo}</p>
                    <p className="text-sm text-texto-suave mb-2">Vencimento: {formatarData(parcela.vencimento)}</p>
                    <StatusBadge status={parcela.status} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-mono text-lg text-texto block mb-2">{formatarMoeda(parcela.valor)}</span>
                  {parcela.boletoUrl && (
                    <a
                      href={parcela.boletoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-roxo-claro bg-roxo/10 border border-roxo/25 rounded-lg px-3 py-2 hover:bg-roxo/20 transition-colors"
                    >
                      Emitir boleto
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <span className="text-texto-suave">{rotulo}</span>
      <span className="font-mono text-texto text-right">{valor}</span>
    </div>
  );
}
