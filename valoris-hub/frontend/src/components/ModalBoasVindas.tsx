import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, X, Mail } from 'lucide-react';
import IlustracaoAbstrata from './IlustracaoAbstrata';
import BotaoMarca from './BotaoMarca';

const CHAVE_JA_VIU = 'valoris_ja_viu_boas_vindas';

const ORIENTACOES = [
  'Nunca solicitamos pagamentos por PIX, transferência bancária ou depósito em conta para formalizar negociações.',
  'O beneficiário do boleto será sempre a instituição credora ou empresa responsável pelo contrato.',
  'Antes de pagar, confira cuidadosamente os dados do beneficiário.',
  'Desconfie de boletos enviados por terceiros ou por canais não oficiais.',
  'Os boletos enviados pela Valoris são encaminhados exclusivamente pelos nossos canais oficiais.',
  'Em caso de dúvida sobre a autenticidade de um boleto, fale com a gente antes de pagar.',
];

export default function ModalBoasVindas() {
  const [aberto, setAberto] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const jaViu = localStorage.getItem(CHAVE_JA_VIU);
    if (!jaViu) setAberto(true);
  }, []);

  function fechar() {
    localStorage.setItem(CHAVE_JA_VIU, '1');
    setAberto(false);
  }

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="card-vidro max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <button
              onClick={fechar}
              aria-label="Fechar"
              className="absolute top-5 right-5 text-texto-suave hover:text-texto transition-colors"
            >
              <X size={20} />
            </button>

            <div className="grid sm:grid-cols-[160px_1fr] gap-6 items-start">
              <IlustracaoAbstrata
                variante={slide === 0 ? 'seguranca' : 'ia'}
                className="w-full sm:w-40 hidden sm:block"
              />

              <div>
                <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-roxo-claro bg-roxo/10 border border-roxo/25 rounded-full px-3 py-1.5 mb-4">
                  <ShieldAlert size={13} /> Antes de começar
                </span>
                <h2 className="font-display font-semibold text-2xl text-texto mb-2">
                  Sua segurança vem em primeiro lugar
                </h2>
                <p className="text-texto-suave text-sm mb-5">
                  Antes de iniciar sua negociação, confira algumas orientações importantes para
                  garantir uma experiência segura.
                </p>

                <ul className="space-y-2.5 mb-6">
                  {ORIENTACOES.map((texto, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-texto-suave">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-roxo-claro flex-shrink-0" />
                      {texto}
                    </li>
                  ))}
                </ul>

                <div className="linha-luminosa mb-5" />

                <p className="flex items-center gap-2 text-sm text-texto-suave mb-6">
                  <Mail size={15} className="text-azul" />
                  Dúvidas? <span className="text-texto">meajuda@valorissolucoes.com.br</span>
                </p>

                <div className="flex gap-3">
                  <BotaoMarca onClick={fechar} full>Acessar Portal</BotaoMarca>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
