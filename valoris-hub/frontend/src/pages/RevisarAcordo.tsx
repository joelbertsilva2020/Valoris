import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { usePortal } from '../state/PortalContext';
import { formatarMoeda, formatarData } from '../lib/cpf';
import PortalPainel from '../components/PortalPainel';
import BotaoMarca from '../components/BotaoMarca';

export default function RevisarAcordo() {
  const navigate = useNavigate();
  const { contratoAtual, propostaEscolhida } = usePortal();
  const [aceitou, setAceitou] = useState(false);

  if (!contratoAtual || !propostaEscolhida) {
    navigate('/contratos');
    return null;
  }

  const p = propostaEscolhida;
  const parcelasReais = p.entrada ? (p.parcelas || []).slice(1) : p.parcelas || [];
  const qtdParcelas = parcelasReais.length;
  const valorParcela = parcelasReais[0]?.valor ?? (qtdParcelas ? p.valorTotal / qtdParcelas : p.valorTotal);
  const totalPagamentos = p.tipo === 'a_vista' ? 1 : (p.parcelas || []).length || qtdParcelas + (p.entrada ? 1 : 0);

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
      <p className="text-claro-suave text-sm mb-6">Confira as condições do acordo antes de continuar.</p>

      <div className="max-w-md space-y-4">
        <div className="bg-claro-superficie border border-claro-linha rounded-xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-claro-suave">Forma de pagamento</span>
            <span className="text-claro-texto font-medium">
              {p.tipo === 'a_vista' ? 'À vista' : `${totalPagamentos}x`}
            </span>
          </div>

          {p.entrada && (
            <div className="flex justify-between text-sm">
              <span className="text-claro-suave">Entrada</span>
              <span className="text-claro-texto font-mono">
                {formatarMoeda(p.entrada.valor)} até {formatarData(p.entrada.vencimento)}
              </span>
            </div>
          )}

          {p.tipo === 'parcelado' && qtdParcelas > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-claro-suave">Parcelas</span>
              <span className="text-claro-texto font-mono">
                {qtdParcelas}x de {formatarMoeda(valorParcela)}
              </span>
            </div>
          )}

          {p.tipo === 'a_vista' && p.vencimentoMaximo && (
            <div className="flex justify-between text-sm">
              <span className="text-claro-suave">Vencimento</span>
              <span className="text-claro-texto font-mono">até {formatarData(p.vencimentoMaximo)}</span>
            </div>
          )}

          {p.percentualEconomia !== null && p.percentualEconomia > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-claro-suave">Desconto aplicado</span>
              <span className="text-green-600 font-semibold">{p.percentualEconomia}%</span>
            </div>
          )}

          <div className="h-px bg-claro-linha" />

          <div className="flex justify-between items-center">
            <span className="text-claro-texto font-medium">Total do acordo</span>
            <span className="font-mono text-lg text-claro-texto">{formatarMoeda(p.valorTotal)}</span>
          </div>
        </div>

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

        <BotaoMarca full disabled={!aceitou} onClick={() => navigate('/confirmar-acordo')}>
          Confirmar e Continuar
        </BotaoMarca>
      </div>
    </PortalPainel>
  );
}
