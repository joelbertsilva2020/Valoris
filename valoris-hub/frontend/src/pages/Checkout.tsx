import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { usePortal } from '../state/PortalContext';
import { chamarApi } from '../lib/api';
import { formatarMoeda, formatarData } from '../lib/cpf';
import BotaoMarca from '../components/BotaoMarca';

export default function Checkout() {
  const navigate = useNavigate();
  const { cpf, contratoAtual, propostaEscolhida } = usePortal();
  const [concordo, setConcordo] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<{ acordoId: string; valorTotal: number; proximoVencimento: string } | null>(null);

  if (!contratoAtual || !propostaEscolhida) {
    navigate('/');
    return null;
  }

  async function confirmar() {
    setErro(null);
    setConfirmando(true);
    try {
      const resultado = await chamarApi<{ acordoId: string; valorTotal: number; proximoVencimento: string }>(
        '/confirmar-acordo',
        { contratoId: contratoAtual!.id, propostaEscolhida, cpf }
      );
      setSucesso(resultado);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setConfirmando(false);
    }
  }

  const proposta = propostaEscolhida;

  return (
    <div className="max-w-lg mx-auto">
      <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-roxo-claro bg-roxo/10 border border-roxo/25 rounded-full px-3 py-1.5 mb-5">
        Confirme sua negociação
      </span>
      <h1 className="font-display font-semibold text-3xl text-texto mb-6">Revise tudo antes de confirmar.</h1>

      <div className="flex items-center gap-3 mb-4">
        <span className="w-11 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 p-1.5">
          <img src="/parceiros/nosso-pay.png" alt="Nosso Pay" className="max-w-full max-h-full object-contain" />
        </span>
        <span className="text-sm text-texto-suave">Contrato com <strong className="text-texto">Nosso Pay</strong></span>
      </div>

      <div className="card-vidro p-6 mb-6 divide-y divide-linha">
        <Linha rotulo="Parceiro" valor="Nosso Pay" />
        <Linha rotulo="Contrato" valor={contratoAtual.numero} />
        <Linha rotulo="Valor atualizado da dívida" valor={formatarMoeda(contratoAtual.valorAtualizado)} />
        <Linha rotulo="Valor total do acordo" valor={formatarMoeda(proposta.valorTotal)} />
        {proposta.percentualEconomia && proposta.percentualEconomia > 0 && (
          <Linha rotulo="Percentual de economia" valor={`${proposta.percentualEconomia}%`} />
        )}
        <Linha rotulo="Forma de pagamento" valor={proposta.tipo === 'a_vista' ? 'À vista' : `Parcelado (${proposta.parcelas?.length}x)`} />

        {proposta.tipo === 'a_vista' ? (
          <Linha rotulo="Vencimento" valor={formatarData(proposta.vencimentoMaximo!)} />
        ) : (
          <>
            <Linha rotulo={`Entrada — vence em ${formatarData(proposta.entrada!.vencimento)}`} valor={formatarMoeda(proposta.entrada!.valor)} />
            {proposta.parcelas!.map((p) => (
              <Linha key={p.numero} rotulo={`Parcela ${p.numero} — vence em ${formatarData(p.vencimento)}`} valor={formatarMoeda(p.valor)} />
            ))}
          </>
        )}
      </div>

      <label className="flex items-start gap-3 text-sm text-texto-suave mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={concordo}
          onChange={(e) => setConcordo(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-roxo-claro"
        />
        Li e concordo com as condições desta negociação.
      </label>

      <BotaoMarca full disabled={!concordo || confirmando} onClick={confirmar}>
        {confirmando ? 'Confirmando…' : 'Confirmar acordo'}
      </BotaoMarca>
      {erro && <p className="text-sm text-red-400 mt-3">{erro}</p>}

      <AnimatePresence>
        {sucesso && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="card-vidro max-w-md w-full p-8 text-center"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
            >
              <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-grad-marca flex items-center justify-center shadow-glow">
                <CheckCircle size={26} className="text-white" />
              </div>
              <h2 className="font-display font-semibold text-2xl text-texto mb-2">Acordo realizado com sucesso.</h2>
              <p className="text-texto-suave text-sm mb-6">
                Número do acordo: <strong className="text-texto">{sucesso.acordoId}</strong><br />
                Valor: <strong className="text-texto">{formatarMoeda(sucesso.valorTotal)}</strong><br />
                Próximo vencimento: <strong className="text-texto">{formatarData(sucesso.proximoVencimento)}</strong>
              </p>
              <BotaoMarca full onClick={() => navigate('/meu-acordo')}>Ir para meu acordo</BotaoMarca>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
