import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { usePortal, Contrato } from '../state/PortalContext';
import { formatarMoeda } from '../lib/cpf';

export default function Contratos() {
  const navigate = useNavigate();
  const { contratos, nome, setContratoAtual } = usePortal();

  if (contratos.length === 0) {
    navigate('/');
    return null;
  }

  function abrirPropostas(contrato: Contrato) {
    setContratoAtual(contrato);
    navigate('/propostas');
  }

  return (
    <div>
      <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-roxo-claro bg-roxo/10 border border-roxo/25 rounded-full px-3 py-1.5 mb-5">
        Suas pendências
      </span>
      <h1 className="font-display font-semibold text-3xl text-texto mb-3">
        {nome ? `Olá, ${nome.split(' ')[0]}. Veja o que encontramos.` : 'Veja o que encontramos.'}
      </h1>
      <p className="text-texto-suave mb-8">Escolha um contrato para ver as propostas disponíveis.</p>

      <div className="space-y-3">
        {contratos.map((contrato) => (
          <button
            key={contrato.id}
            onClick={() => abrirPropostas(contrato)}
            className="card-vidro card-vidro-hover w-full flex items-center justify-between gap-4 p-5 text-left"
          >
            <div className="flex gap-4 items-start">
              <span className="w-11 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 p-1.5">
                <img src="/parceiros/nosso-pay.png" alt="Nosso Pay" className="max-w-full max-h-full object-contain" />
              </span>
              <div>
                <p className="font-semibold text-texto">{contrato.descricao}</p>
                <p className="text-sm text-texto-suave">Contrato {contrato.numero}</p>
                <p className="text-sm text-azul mt-1.5">{contrato.mensagem}</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-2 flex-shrink-0">
              <span className="font-mono text-lg text-texto">{formatarMoeda(contrato.valorAtualizado)}</span>
              <ChevronRight size={18} className="text-texto-suave" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
