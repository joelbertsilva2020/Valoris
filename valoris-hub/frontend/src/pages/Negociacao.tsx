import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { usePortal, Proposta } from '../state/PortalContext';
import { chamarApi } from '../lib/api';
import { formatarMoeda, formatarData } from '../lib/cpf';
import PortalPainel from '../components/PortalPainel';
import BotaoMarca from '../components/BotaoMarca';

interface DiagnosticoTentativa {
  negociacaoId: string;
  negociacaoNome?: string;
  ok: boolean;
  corpoEnviado?: unknown;
  parcelamentosGerados?: number;
  totalParcelamentosNaResposta?: number;
  valorDivida?: number;
  respostaCompleta?: unknown;
  status?: number | null;
  detalhe?: unknown;
}
interface Diagnostico {
  totalNegociacoesConfiguradas: number;
  tentativas: DiagnosticoTentativa[];
}

type Forma = 'a_vista' | 'parcelado';

export default function Negociacao() {
  const navigate = useNavigate();
  const { cpf, contratoAtual, setPropostaEscolhida } = usePortal();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [valorAtualizado, setValorAtualizado] = useState<number | null>(null);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [diagnostico, setDiagnostico] = useState<Diagnostico | undefined>(undefined);
  const [forma, setForma] = useState<Forma>('a_vista');
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);

  useEffect(() => {
    if (!contratoAtual) {
      navigate('/contratos');
      return;
    }

    let cancelado = false;
    setCarregando(true);
    setErro(null);

    chamarApi<{ valorAtualizadoContrato: number; propostas: Proposta[]; diagnostico?: Diagnostico }>('/propostas', {
      clienteId: contratoAtual.clienteId,
      contratoId: contratoAtual.id,
      cpf,
    })
      .then((resposta) => {
        if (cancelado) return;
        setValorAtualizado(resposta.valorAtualizadoContrato);
        setPropostas(resposta.propostas || []);
        setDiagnostico(resposta.diagnostico);
        const primeiraAVista = resposta.propostas?.find((p) => p.tipo === 'a_vista');
        if (primeiraAVista) {
          setForma('a_vista');
          setSelecionadaId(primeiraAVista.id);
        } else if (resposta.propostas?.length) {
          setForma('parcelado');
          setSelecionadaId(resposta.propostas[0].id);
        }
      })
      .catch((e) => !cancelado && setErro(e.message))
      .finally(() => !cancelado && setCarregando(false));

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratoAtual]);

  if (!contratoAtual) return null;

  const propostasAVista = propostas.filter((p) => p.tipo === 'a_vista');
  const propostasParceladas = propostas
    .filter((p) => p.tipo === 'parcelado')
    .sort((a, b) => (a.parcelas?.length || 0) - (b.parcelas?.length || 0));

  const selecionada = propostas.find((p) => p.id === selecionadaId) || null;

  function escolherForma(novaForma: Forma) {
    setForma(novaForma);
    const lista = novaForma === 'a_vista' ? propostasAVista : propostasParceladas;
    setSelecionadaId(lista[0]?.id ?? null);
  }

  async function continuar() {
    if (!selecionada || !contratoAtual) return;
    setPropostaEscolhida(selecionada);
    chamarApi('/escolher-proposta', {
      clienteId: contratoAtual.clienteId,
      contratoId: contratoAtual.id,
      propostaId: selecionada.id,
      cpf,
    }).catch(() => {});
    navigate('/revisar-acordo');
  }

  return (
    <PortalPainel
      rotulo={`Contrato ${contratoAtual.numero}`}
      titulo="Monte sua negociação"
      acaoTopo={
        <button
          onClick={() => navigate('/contratos')}
          className="flex items-center gap-1.5 text-sm text-white/85 hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft size={15} /> Voltar
        </button>
      }
    >
      {carregando && (
        <div className="flex items-center gap-3 text-claro-suave py-10 justify-center">
          <Loader2 size={20} className="animate-spin" /> Buscando as melhores condições…
        </div>
      )}

      {erro && !carregando && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          {erro}
        </div>
      )}

      {!carregando && !erro && (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div>
            {valorAtualizado !== null && (
              <p className="text-sm text-claro-suave mb-5">
                Valor atualizado da dívida: <span className="font-mono text-claro-texto">{formatarMoeda(valorAtualizado)}</span>
              </p>
            )}

            {/* Abas: forma de pagamento */}
            <div className="flex gap-2 mb-5">
              {propostasAVista.length > 0 && (
                <button
                  onClick={() => escolherForma('a_vista')}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    forma === 'a_vista'
                      ? 'bg-grad-marca text-white border-transparent'
                      : 'bg-claro-superficie text-claro-suave border-claro-linha hover:border-roxo/40'
                  }`}
                >
                  À vista
                </button>
              )}
              {propostasParceladas.length > 0 && (
                <button
                  onClick={() => escolherForma('parcelado')}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    forma === 'parcelado'
                      ? 'bg-grad-marca text-white border-transparent'
                      : 'bg-claro-superficie text-claro-suave border-claro-linha hover:border-roxo/40'
                  }`}
                >
                  Parcelado
                </button>
              )}
            </div>

            {diagnostico && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-800 font-mono space-y-1.5 mb-5">
                <p className="font-sans font-semibold text-amber-900">Diagnóstico (temporário):</p>
                <p>{diagnostico.totalNegociacoesConfiguradas} negociação(ões) configurada(s).</p>
                {diagnostico.tentativas.map((t) => (
                  <div key={t.negociacaoId} className="space-y-1">
                    <p>
                      {t.negociacaoNome || t.negociacaoId}:{' '}
                      {t.ok
                        ? `${t.parcelamentosGerados} parcelamento(s) gerado(s) (${t.totalParcelamentosNaResposta} na resposta antes do filtro), valorDivida=${t.valorDivida}`
                        : `falhou (status ${t.status ?? '?'}) — ${JSON.stringify(t.detalhe)}`}
                    </p>
                    {t.corpoEnviado && <p className="break-all opacity-70">enviado: {JSON.stringify(t.corpoEnviado)}</p>}
                    {t.ok && (
                      <p className="break-all opacity-80">resposta: {JSON.stringify(t.respostaCompleta)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {propostas.length === 0 && (
              <p className="text-claro-suave text-sm">Nenhuma condição de negociação disponível para este contrato no momento.</p>
            )}

            {/* Opção à vista */}
            {forma === 'a_vista' && (
              <div className="space-y-2.5">
                {propostasAVista.map((p) => (
                  <OpcaoProposta
                    key={p.id}
                    selecionada={p.id === selecionadaId}
                    onSelecionar={() => setSelecionadaId(p.id)}
                    titulo={`Pagamento único — ${formatarMoeda(p.valorTotal)}`}
                    detalhe={p.vencimentoMaximo ? `Vencimento até ${formatarData(p.vencimentoMaximo)}` : undefined}
                    economia={p.percentualEconomia}
                  />
                ))}
              </div>
            )}

            {/* Opções parceladas */}
            {forma === 'parcelado' && (
              <div className="space-y-2.5">
                {propostasParceladas.map((p) => {
                  const qtdParcelas = p.parcelas?.length || 0;
                  const valorParcela = p.parcelas?.[0]?.valor ?? p.valorTotal / (qtdParcelas || 1);
                  const totalPagamentos = qtdParcelas + (p.entrada ? 1 : 0);
                  const detalhe = p.entrada
                    ? `Entrada de ${formatarMoeda(p.entrada.valor)} até ${formatarData(p.entrada.vencimento)} + ${qtdParcelas}x de ${formatarMoeda(valorParcela)}`
                    : undefined;
                  return (
                    <OpcaoProposta
                      key={p.id}
                      selecionada={p.id === selecionadaId}
                      onSelecionar={() => setSelecionadaId(p.id)}
                      titulo={`${totalPagamentos}x de ${formatarMoeda(valorParcela)}`}
                      detalhe={detalhe}
                      total={formatarMoeda(p.valorTotal)}
                      economia={p.percentualEconomia}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumo lateral */}
          <div className="bg-claro-superficie border border-claro-linha rounded-xl p-5 h-fit lg:sticky lg:top-6">
            <p className="text-xs uppercase tracking-wide text-claro-suave font-mono mb-3">Resumo da proposta</p>
            {selecionada ? (
              <>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-claro-suave">Forma</span>
                  <span className="text-claro-texto font-medium">
                    {selecionada.tipo === 'a_vista' ? 'À vista' : `${selecionada.parcelas?.length}x`}
                  </span>
                </div>
                {selecionada.percentualEconomia !== null && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-claro-suave">Economia</span>
                    <span className="text-green-600 font-semibold">{selecionada.percentualEconomia}%</span>
                  </div>
                )}
                <div className="h-px bg-claro-linha my-3" />
                <div className="flex justify-between mb-5">
                  <span className="text-claro-texto font-medium">Total</span>
                  <span className="font-mono text-lg text-claro-texto">{formatarMoeda(selecionada.valorTotal)}</span>
                </div>
                <BotaoMarca full onClick={continuar}>
                  Revisar Acordo e Confirmar
                </BotaoMarca>
              </>
            ) : (
              <p className="text-sm text-claro-suave">Escolha uma condição ao lado para continuar.</p>
            )}
          </div>
        </div>
      )}
    </PortalPainel>
  );
}

function OpcaoProposta({
  selecionada,
  onSelecionar,
  titulo,
  detalhe,
  total,
  economia,
}: {
  selecionada: boolean;
  onSelecionar: () => void;
  titulo: string;
  detalhe?: string;
  total?: string;
  economia: number | null;
}) {
  return (
    <button
      onClick={onSelecionar}
      className={`w-full flex items-center justify-between gap-4 p-4 rounded-xl border text-left transition-colors ${
        selecionada ? 'border-roxo bg-roxo/[0.04]' : 'border-claro-linha bg-claro-superficie hover:border-roxo/30'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
            selecionada ? 'bg-grad-marca border-transparent' : 'border-claro-linha'
          }`}
        >
          {selecionada && <Check size={12} className="text-white" strokeWidth={3} />}
        </span>
        <div className="min-w-0">
          <p className="font-medium text-claro-texto truncate">{titulo}</p>
          {detalhe && <p className="text-sm text-claro-suave">{detalhe}</p>}
          {total && <p className="text-sm text-claro-texto font-mono mt-0.5">Total {total}</p>}
        </div>
      </div>
      {economia !== null && economia > 0 && (
        <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 flex-shrink-0">
          -{economia}%
        </span>
      )}
    </button>
  );
}
