import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { usePortal, Proposta } from '../state/PortalContext';
import { chamarApi } from '../lib/api';
import { formatarMoeda, formatarData } from '../lib/cpf';

export default function Propostas() {
  const navigate = useNavigate();
  const { cpf, contratoAtual, setPropostaEscolhida } = usePortal();
  const [propostas, setPropostas] = useState<Proposta[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!contratoAtual) {
      navigate('/');
      return;
    }
    chamarApi<{ propostas: Proposta[] }>('/propostas', { contratoId: contratoAtual.id, cpf })
      .then((r) => setPropostas(r.propostas))
      .catch((e) => setErro(e.message));
  }, [contratoAtual]);

  if (!contratoAtual) return null;

  function escolher(proposta: Proposta) {
    setPropostaEscolhida(proposta);
    chamarApi('/escolher-proposta', { contratoId: contratoAtual!.id, propostaId: proposta.id, cpf }).catch(() => {});
    navigate('/checkout');
  }

  return (
    <div>
      <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-roxo-claro bg-roxo/10 border border-roxo/25 rounded-full px-3 py-1.5 mb-5">
        Propostas de negociação
      </span>
      <div className="flex items-center gap-3 mb-5">
        <span className="w-11 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 p-1.5">
          <img src="/parceiros/nosso-pay.png" alt="Nosso Pay" className="max-w-full max-h-full object-contain" />
        </span>
        <span className="text-sm text-texto-suave">Negociação com <strong className="text-texto">Nosso Pay</strong></span>
      </div>
      <h1 className="font-display font-semibold text-3xl text-texto mb-3">Escolha a proposta que faz sentido para você.</h1>
      <p className="text-texto-suave mb-8">
        Referente a: {contratoAtual.descricao} — valor atualizado de {formatarMoeda(contratoAtual.valorAtualizado)}.
      </p>

      {erro && <p className="text-sm text-red-400 mb-4">{erro}</p>}

      <div className="space-y-3">
        {propostas?.map((proposta) => {
          const detalhe = proposta.tipo === 'a_vista'
            ? `Pagamento à vista — vencimento até ${formatarData(proposta.vencimentoMaximo!)}`
            : `Entrada de ${formatarMoeda(proposta.entrada!.valor)} + ${proposta.parcelas!.length}x de ${formatarMoeda(proposta.parcelas![0].valor)}`;

          return (
            <button
              key={proposta.id}
              onClick={() => escolher(proposta)}
              className="card-vidro card-vidro-hover w-full flex items-center justify-between gap-4 p-5 text-left"
            >
              <div className="flex gap-4 items-start">
                <span className="w-9 h-9 rounded-lg bg-roxo/10 border border-roxo/25 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={16} className="text-roxo-claro" />
                </span>
                <div>
                  <p className="font-semibold text-texto">
                    {proposta.tipo === 'a_vista' ? 'Proposta à vista' : `Parcelado em ${proposta.parcelas!.length}x`}
                  </p>
                  <p className="text-sm text-texto-suave">{detalhe}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="font-mono text-lg text-texto block">{formatarMoeda(proposta.valorTotal)}</span>
                {proposta.percentualEconomia && proposta.percentualEconomia > 0 && (
                  <span className="inline-block mt-1.5 text-xs font-mono text-white bg-grad-marca px-2.5 py-1 rounded-full">
                    {proposta.percentualEconomia}% de economia
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
