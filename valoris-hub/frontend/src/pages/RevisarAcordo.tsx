import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { usePortal } from '../state/PortalContext';
import { formatarMoeda, formatarData } from '../lib/cpf';
import PortalPainel from '../components/PortalPainel';
import BotaoMarca from '../components/BotaoMarca';
import AvisoSessao from '../components/AvisoSessao';

export default function RevisarAcordo() {
  const navigate = useNavigate();
  const { contratoAtual, propostaEscolhida, diasAtraso } = usePortal();
  const [aceitou, setAceitou] = useState(false);

  if (!contratoAtual || !propostaEscolhida) return <AvisoSessao />;

  const p = propostaEscolhida;
  // O CobranSaaS repete a entrada como a primeira posição do array de
  // parcelas — as parcelas "reais" são as que vêm depois dela.
  const parcelasReais = p.entrada ? (p.parcelas || []).slice(1) : p.parcelas || [];
  const totalPagamentos = p.tipo === 'a_vista' ? 1 : (p.parcelas || []).length;
  const valorDesconto = contratoAtual.valorAtualizado - Number(p.valorTotal);

  return (
    <PortalPainel
      rotulo={`Contrato ${contratoAtual.numero}`}
      titulo="Revisar Acordo"
      acaoTopo={
        <button
          onClick={() => navigate('/negociacao')}
          className="flex items-center gap-1.5 text-sm text-white/85 hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft size={15} /> Voltar
        </button>
      }
    >
      <p className="text-claro-suave text-sm mb-6">Confira todas as condições do acordo antes de continuar.</p>

      <div className="max-w-md space-y-4">
        {/* Situação atual da dívida */}
        <div className="bg-claro-superficie border border-claro-linha rounded-xl p-5 space-y-2.5">
          <p className="text-xs uppercase tracking-wide text-claro-suave font-mono mb-1">Situação atual</p>
          <div className="flex justify-between text-sm">
            <span className="text-claro-suave">Contrato</span>
            <span className="text-claro-texto font-mono">{contratoAtual.numero}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-claro-suave">Dívida atual</span>
            <span className="text-claro-texto font-mono">{formatarMoeda(contratoAtual.valorAtualizado)}</span>
          </div>
          {diasAtraso !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-claro-suave">Dias em atraso</span>
              <span className="text-red-600 font-medium">{diasAtraso}</span>
            </div>
          )}
        </div>

        {/* Condições negociadas */}
        <div className="bg-claro-superficie border border-claro-linha rounded-xl p-5 space-y-2.5">
          <p className="text-xs uppercase tracking-wide text-claro-suave font-mono mb-1">Condições negociadas</p>

          <div className="flex justify-between text-sm">
            <span className="text-claro-suave">Forma de pagamento</span>
            <span className="text-claro-texto font-medium">
              {p.tipo === 'a_vista' ? 'À vista' : `Parcelado em ${totalPagamentos}x`}
            </span>
          </div>

          {p.tipo === 'a_vista' && p.vencimentoMaximo && (
            <div className="flex justify-between text-sm">
              <span className="text-claro-suave">Vencimento</span>
              <span className="text-claro-texto font-mono">até {formatarData(p.vencimentoMaximo)}</span>
            </div>
          )}

          {valorDesconto > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-claro-suave">Desconto obtido</span>
              <span className="text-green-600 font-semibold">
                {formatarMoeda(valorDesconto)}
                {p.percentualEconomia !== null && ` (${p.percentualEconomia}%)`}
              </span>
            </div>
          )}

          <div className="h-px bg-claro-linha" />

          <div className="flex justify-between items-center">
            <span className="text-claro-texto font-medium">Total do acordo</span>
            <span className="font-mono text-lg text-claro-texto">{formatarMoeda(p.valorTotal)}</span>
          </div>
        </div>

        {/* Detalhamento parcela a parcela */}
        {p.tipo === 'parcelado' && (p.entrada || parcelasReais.length > 0) && (
          <div className="bg-claro-superficie border border-claro-linha rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-claro-suave font-mono mb-3">Detalhamento dos pagamentos</p>
            <div className="space-y-2">
              {p.entrada && (
                <div className="flex justify-between text-sm">
                  <span className="text-claro-texto">Entrada — {formatarData(p.entrada.vencimento)}</span>
                  <span className="text-claro-texto font-mono">{formatarMoeda(p.entrada.valor)}</span>
                </div>
              )}
              {parcelasReais.map((parcela, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-claro-texto">
                    Parcela {i + 1}/{parcelasReais.length} — {formatarData(parcela.vencimento)}
                  </span>
                  <span className="text-claro-texto font-mono">{formatarMoeda(parcela.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-start gap-3 text-sm text-claro-texto cursor-pointer select-none">
          <span
            onClick={() => setAceitou((v) => !v)}
            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
              aceitou ? 'bg-grad-marca border-transparent' : 'border-claro-linha bg-claro-superficie'
            }`}
          >
            {aceitou && <Check size={13} className="text-white" strokeWidth={3} />}
          </span>
          <span onClick={() => setAceitou((v) => !v)}>
            Li e estou de acordo com as condições desta negociação, incluindo valores e datas de vencimento acima.
          </span>
        </label>

        <BotaoMarca
          full
          aria-disabled={!aceitou}
          onClick={() => {
            if (aceitou) navigate('/confirmar-acordo');
          }}
          className={
            aceitou
              ? ''
              : 'opacity-60 saturate-[.4] cursor-not-allowed hover:opacity-75 hover:saturate-50 transition-all'
          }
        >
          Confirmar e Continuar
        </BotaoMarca>
      </div>
    </PortalPainel>
  );
}
