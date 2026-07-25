import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

const ETAPAS = [
  { titulo: 'Consulte seu CPF', texto: 'Verificamos, em segundos, se existe alguma oportunidade disponível para você em nossos parceiros.' },
  { titulo: 'Escolha sua proposta', texto: 'Você vê todas as condições — à vista ou parcelado — antes de decidir qualquer coisa.' },
  { titulo: 'Confirme com segurança', texto: 'Só depois de revisar tudo com calma, você confirma. Nada é criado antes disso.' },
];

const COR_ROXA = '#B05CFF';
const COR_VERDE = '#00FF85';

export default function JornadaComoFunciona() {
  const [passo, setPasso] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPasso((p) => (p + 1) % (ETAPAS.length + 1));
    }, 1700);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="py-16">
      <h2 className="font-display font-semibold text-2xl sm:text-3xl text-texto mb-10">Como funciona</h2>

      <div>
        {ETAPAS.map((etapa, i) => {
          const aceso = i < passo;
          const ultimo = i === ETAPAS.length - 1;
          const cor = ultimo ? COR_VERDE : COR_ROXA;

          return (
            <div key={i} className="flex gap-5">
              <div className="flex flex-col items-center flex-shrink-0">
                <motion.div
                  className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-bg-alt/60"
                  animate={{
                    borderColor: aceso ? cor : 'rgba(255,255,255,0.14)',
                    boxShadow: aceso ? `0 0 20px 5px ${cor}66` : '0 0 0 rgba(0,0,0,0)',
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {ultimo ? (
                    <Rocket size={19} style={{ color: aceso ? cor : '#9C97B5' }} strokeWidth={2} />
                  ) : (
                    <span className="font-mono text-sm" style={{ color: aceso ? cor : '#9C97B5' }}>
                      {i + 1}
                    </span>
                  )}
                </motion.div>

                {!ultimo && (
                  <div className="w-0.5 flex-1 min-h-[64px] bg-white/10 relative overflow-hidden rounded-full">
                    <motion.div
                      className="absolute inset-x-0 top-0 rounded-full"
                      style={{ background: COR_ROXA }}
                      animate={{ height: aceso ? '100%' : '0%' }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                  </div>
                )}
              </div>

              <div className="card-vidro p-6 mb-5 flex-1">
                <p className="font-semibold text-texto mb-1.5">{etapa.titulo}</p>
                <p className="text-sm text-texto-suave">{etapa.texto}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
