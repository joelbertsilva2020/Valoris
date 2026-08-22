import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, FileDown, Clock3 } from 'lucide-react';
import { usePortal } from '../state/PortalContext';
import { chamarApi } from '../lib/api';
import { formatarMoeda, formatarData } from '../lib/cpf';
import PortalPainel from '../components/PortalPainel';
import AvisoSessao from '../components/AvisoSessao';
import StatusParcela, { SituacaoParcela } from '../components/StatusParcela';

interface Boleto {
  situacao: 'PENDENTE' | 'REGISTRADO' | 'LIQUIDADO' | 'CANCELADO' | 'PAGO';
}

interface ParcelaAcordo {
  id: string;
  numeroParcela: number;
  dataVencimento: string;
  situacao: SituacaoParcela;
  valorTotal: number;
  registrado?: boolean;
  boletos?: Boleto[];
}

interface AcordoDetalhe {
  id: string;
  numeroAcordo?: string;
  situacao: string;
  valorTotal: number;
  contrato?: { numeroContrato?: string };
  parcelas?: ParcelaAcordo[];
}

/** O boleto só pode ser oferecido se o CobranSaaS já tiver um boleto
 * registrado/pendente pra essa parcela — nunca por uma regra de dias
 * inventada por nós. A janela de "~10 dias antes" (informada pelo
 * usuário) só serve pra explicar visualmente POR QUE ainda não está
 * disponível, nunca pra decidir se mostra o botão. */
function boletoDisponivel(parcela: ParcelaAcordo) {
  if (parcela.registrado) return true;
  return (parcela.boletos || []).some((b) => b.situacao === 'REGISTRADO' || b.situacao === 'PENDENTE');
}

export default function DetalhesAcordo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contratoAtual } = usePortal();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acordo, setAcordo] = useState<AcordoDetalhe | null>(null);
  const [baixandoParcelaId, setBaixandoParcelaId] = useState<string | null>(null);

  useEffect(() => {
    if (!contratoAtual || !id) return;
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    chamarApi<AcordoDetalhe>('/acordo-detalhe', { acordoId: id, clienteId: contratoAtual.clienteId })
      .then((resposta) => {
        if (!cancelado) setAcordo(resposta);
      })
      .catch((e) => !cancelado && setErro(e.message))
      .finally(() => !cancelado && setCarregando(false));

    return () => {
      cancelado = true;
    };
  }, [contratoAtual, id]);

  if (!contratoAtual || !id) return <AvisoSessao />;

  async function baixarBoleto(parcelaId: string) {
    if (!contratoAtual) return;
    setBaixandoParcelaId(parcelaId);
    try {
      const resposta = await fetch('/api/portal/acordo-boleto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acordoId: id, parcelaId, clienteId: contratoAtual.clienteId }),
      });
      if (!resposta.ok) throw new Error('Não foi possível abrir o boleto agora. Tente novamente em instantes.');
      const blob = await resposta.blob();
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (e: any) {
      setErro(e.message || 'Não foi possível abrir o boleto agora.');
    } finally {
      setBaixandoParcelaId(null);
    }
  }

  const parcelasOrdenadas = [...(acordo?.parcelas || [])].sort((a, b) => a.numeroParcela - b.numeroParcela);

  return (
    <PortalPainel
      rotulo={acordo?.numeroAcordo ? `Acordo nº ${acordo.numeroAcordo}` : 'Detalhes do acordo'}
      titulo="Detalhes do acordo"
      acaoTopo={
        <button
          onClick={() => navigate('/acordo-ativo')}
          className="flex items-center gap-1.5 text-sm text-white/85 hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft size={15} /> Voltar
        </button>
      }
    >
      {carregando && (
        <div className="flex items-center gap-3 text-claro-suave py-10 justify-center">
          <Loader2 size={20} className="animate-spin" /> Consultando seu acordo…
        </div>
      )}

      {erro && !carregando && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-5">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          {erro}
        </div>
      )}

      {!carregando && acordo && (
        <div className="max-w-lg space-y-5">
          <div className="bg-claro-superficie border border-claro-linha rounded-xl p-5 space-y-2">
            {acordo.contrato?.numeroContrato && (
              <div className="flex justify-between text-sm">
                <span className="text-claro-suave">Contrato</span>
                <span className="text-claro-texto font-mono">{acordo.contrato.numeroContrato}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-claro-suave">Situação</span>
              <span className="text-claro-texto font-medium">Acordo ativo</span>
            </div>
            <div className="h-px bg-claro-linha" />
            <div className="flex justify-between items-center">
              <span className="text-claro-texto font-medium">Valor total do acordo</span>
              <span className="font-mono text-lg text-claro-texto">{formatarMoeda(acordo.valorTotal)}</span>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-claro-suave font-mono mb-3">Parcelas do acordo</p>
            <div className="space-y-3">
              {parcelasOrdenadas.map((parcela) => (
                <div key={parcela.id} className="bg-claro-superficie border border-claro-linha rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <p className="font-medium text-claro-texto">
                        {parcela.numeroParcela === 0 ? 'Entrada' : `Parcela ${parcela.numeroParcela}`}
                      </p>
                      <p className="text-sm text-claro-suave">
                        {formatarData(parcela.dataVencimento)} — {formatarMoeda(parcela.valorTotal)}
                      </p>
                    </div>
                    <StatusParcela situacao={parcela.situacao} dataVencimento={parcela.dataVencimento} />
                  </div>

                  {(parcela.situacao === 'ABERTO' || parcela.situacao === 'PARCIAL') && (
                    <div className="mt-2">
                      {boletoDisponivel(parcela) ? (
                        <button
                          onClick={() => baixarBoleto(parcela.id)}
                          disabled={baixandoParcelaId === parcela.id}
                          className="flex items-center gap-2 text-sm font-medium text-roxo hover:text-roxo-claro transition-colors disabled:opacity-60"
                        >
                          {baixandoParcelaId === parcela.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <FileDown size={15} />
                          )}
                          {baixandoParcelaId === parcela.id ? 'Abrindo…' : 'Emitir boleto'}
                        </button>
                      ) : (
                        <p className="flex items-center gap-1.5 text-xs text-claro-suave">
                          <Clock3 size={13} />
                          Seu boleto ainda não está disponível. Ele ficará disponível próximo ao vencimento.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PortalPainel>
  );
}
