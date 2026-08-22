import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePortal } from '../state/PortalContext';
import { chamarApi } from '../lib/api';
import { formatarMoeda, formatarData } from '../lib/cpf';
import PortalPainel from '../components/PortalPainel';
import AvisoSessao from '../components/AvisoSessao';

interface ParcelaAcordo {
  id: string;
  numeroParcela: number;
  dataVencimento: string;
  situacao: string;
  valorTotal: number;
}

interface AcordoResumo {
  id: string;
  numeroAcordo?: string;
  situacao: string;
  valorTotal: number;
  contrato?: { numeroContrato?: string };
  parcelas?: ParcelaAcordo[];
}

/** Acha a próxima parcela ainda não liquidada, na ordem — nunca mostra
 * como "próximo vencimento" uma parcela já paga/concluída/cancelada. */
function proximaParcelaEmAberto(parcelas: ParcelaAcordo[] = []) {
  return [...parcelas]
    .sort((a, b) => a.numeroParcela - b.numeroParcela)
    .find((p) => p.situacao === 'ABERTO' || p.situacao === 'PARCIAL');
}

export default function AcordoAtivo() {
  const navigate = useNavigate();
  const { contratoAtual, nome } = usePortal();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acordos, setAcordos] = useState<AcordoResumo[]>([]);

  useEffect(() => {
    if (!contratoAtual) return;
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    chamarApi<{ acordos: AcordoResumo[] }>('/acordos-ativos', { clienteId: contratoAtual.clienteId })
      .then((resposta) => {
        if (cancelado) return;
        setAcordos(resposta.acordos || []);
      })
      .catch((e) => !cancelado && setErro(e.message))
      .finally(() => !cancelado && setCarregando(false));

    return () => {
      cancelado = true;
    };
  }, [contratoAtual]);

  if (!contratoAtual) return <AvisoSessao />;

  return (
    <PortalPainel rotulo="Acompanhamento" titulo={nome ? `Olá, ${nome.split(' ')[0]}` : 'Seu acordo'}>
      {carregando && (
        <div className="flex items-center gap-3 text-claro-suave py-10 justify-center">
          <Loader2 size={20} className="animate-spin" /> Consultando seus acordos…
        </div>
      )}

      {erro && !carregando && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          Não conseguimos atualizar os dados do seu acordo agora. Tente novamente em instantes.
        </div>
      )}

      {!carregando && !erro && acordos.length === 0 && (
        <p className="text-claro-suave text-sm">Nenhum acordo ativo encontrado no momento.</p>
      )}

      {!carregando && !erro && acordos.length > 0 && (
        <div className="space-y-4">
          {acordos.length > 1 && (
            <p className="text-xs uppercase tracking-wide text-claro-suave font-mono mb-1">Seus acordos</p>
          )}
          {acordos.map((acordo) => {
            const proxima = proximaParcelaEmAberto(acordo.parcelas);
            return (
              <button
                key={acordo.id}
                onClick={() => navigate(`/acordo-detalhe/${acordo.id}`)}
                className="w-full text-left bg-claro-superficie border border-claro-linha rounded-xl p-5 flex items-center justify-between gap-4 transition-colors hover:border-roxo/40"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-claro-texto">Acordo ativo</span>
                  </div>
                  {acordo.contrato?.numeroContrato && (
                    <p className="text-sm text-claro-suave mb-2">Contrato {acordo.contrato.numeroContrato}</p>
                  )}
                  {proxima ? (
                    <>
                      <p className="text-xs uppercase tracking-wide text-claro-suave font-mono">Próximo vencimento</p>
                      <p className="text-claro-texto font-medium">
                        {formatarData(proxima.dataVencimento)} — {formatarMoeda(proxima.valorTotal)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-claro-suave">Todas as parcelas em dia.</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-roxo text-sm font-medium flex-shrink-0">
                  Ver detalhes <ArrowRight size={15} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </PortalPainel>
  );
}
