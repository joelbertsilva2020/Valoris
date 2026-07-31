import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { usePortal, Contrato } from '../state/PortalContext';
import { formatarMoeda } from '../lib/cpf';
import PortalPainel from '../components/PortalPainel';

export default function Contratos() {
  const navigate = useNavigate();
  const { contratos, nome, setContratoAtual } = usePortal();

  if (contratos.length === 0) {
    navigate('/');
    return null;
  }

  function abrirNegociacao(contrato: Contrato) {
    setContratoAtual(contrato);
    navigate('/negociacao');
  }

  return (
    <PortalPainel rotulo="Suas pendências" titulo={nome ? `Olá, ${nome.split(' ')[0]}` : 'Contratos em aberto'}>
      <p className="text-claro-suave mb-7 text-sm sm:text-base">
        Encontramos {contratos.length === 1 ? 'uma pendência' : `${contratos.length} pendências`} no seu CPF.
        Escolha um contrato para ver as condições de negociação.
      </p>

      <div className="space-y-3">
        {contratos.map((contrato) => (
          <button
            key={contrato.id}
            onClick={() => abrirNegociacao(contrato)}
            className="w-full flex items-center justify-between gap-4 p-5 text-left bg-claro-superficie border border-claro-linha rounded-xl transition-all hover:border-roxo/40 hover:shadow-[0_4px_20px_rgba(108,59,255,0.12)]"
          >
            <div className="flex gap-4 items-start min-w-0">
              <span className="h-12 px-2.5 rounded-lg bg-white border border-claro-linha flex items-center justify-center flex-shrink-0">
                <img src="/parceiros/nosso-pay.png" alt="Nosso Pay" className="h-8 w-auto object-contain" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-mono uppercase tracking-wide text-claro-suave mb-0.5">Nosso Pay</p>
                <p className="font-semibold text-claro-texto truncate">{contrato.descricao}</p>
                <p className="text-sm text-claro-suave">Contrato {contrato.numero}</p>
                {contrato.mensagem && (
                  <p className="text-sm text-roxo mt-1.5">{contrato.mensagem}</p>
                )}
              </div>
            </div>
            <div className="text-right flex items-center gap-2 flex-shrink-0">
              <div>
                <p className="text-[11px] text-claro-suave uppercase tracking-wide">Valor atualizado</p>
                <span className="font-mono text-base sm:text-lg text-claro-texto">
                  {formatarMoeda(contrato.valorAtualizado)}
                </span>
              </div>
              <ChevronRight size={18} className="text-claro-suave" />
            </div>
          </button>
        ))}
      </div>
    </PortalPainel>
  );
}
