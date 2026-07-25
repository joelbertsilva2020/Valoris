import { motion } from 'framer-motion';

function IconeDesconto() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <rect x="4" y="9" width="26" height="18" rx="5" stroke="url(#g1)" strokeWidth="1.6" />
      <path d="M11 22L23 13" stroke="url(#g1)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12.5" cy="14.5" r="1.6" fill="#B05CFF" />
      <circle cx="21.5" cy="20.5" r="1.6" fill="#36A8FF" />
      <defs>
        <linearGradient id="g1" x1="4" y1="9" x2="30" y2="27">
          <stop stopColor="#6C3BFF" /><stop offset="1" stopColor="#36A8FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function IconeNomeLimpo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <path d="M17 3l3.4 7 7.6 1-5.6 5.5 1.3 7.6L17 20.8l-6.7 3.3 1.3-7.6L6 11l7.6-1 3.4-7z"
        stroke="url(#g2)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13 17l3 3 5-6" stroke="#36A8FF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="g2" x1="6" y1="3" x2="28" y2="28">
          <stop stopColor="#6C3BFF" /><stop offset="1" stopColor="#B05CFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function IconeOnline() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <rect x="9" y="3" width="16" height="28" rx="3.5" stroke="url(#g3)" strokeWidth="1.6" />
      <path d="M13.5 20.5l3 3 5.5-6.5" stroke="#36A8FF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="27" r="0.9" fill="#B05CFF" />
      <defs>
        <linearGradient id="g3" x1="9" y1="3" x2="25" y2="31">
          <stop stopColor="#6C3BFF" /><stop offset="1" stopColor="#36A8FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function IconeSeguranca() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <path d="M17 3l11 4v8c0 7.5-4.7 13-11 16-6.3-3-11-8.5-11-16V7l11-4z"
        stroke="url(#g4)" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="13" y="16" width="8" height="6.5" rx="1.4" stroke="#36A8FF" strokeWidth="1.5" />
      <path d="M14.5 16v-2.3a2.5 2.5 0 015 0V16" stroke="#B05CFF" strokeWidth="1.5" />
      <defs>
        <linearGradient id="g4" x1="6" y1="3" x2="28" y2="31">
          <stop stopColor="#6C3BFF" /><stop offset="1" stopColor="#B05CFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const BENEFICIOS = [
  { Icone: IconeDesconto, texto: 'Descontos de até 80% e até 6x para quitar tudo.' },
  { Icone: IconeNomeLimpo, texto: 'Nome limpo após pagamento da 1ª parcela.' },
  { Icone: IconeOnline, texto: 'Acordo 100% online e em poucos minutos.' },
  { Icone: IconeSeguranca, texto: '100% seguro e criptografado.' },
];

export default function BeneficiosValoris() {
  return (
    <section className="py-14">
      <h2 className="font-display font-semibold text-2xl sm:text-3xl text-texto mb-8 max-w-lg">
        Por que vale a pena negociar na Valoris?
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {BENEFICIOS.map(({ Icone, texto }, i) => (
          <motion.div
            key={i}
            className="card-vidro card-vidro-hover p-6 flex flex-col items-center text-center gap-4"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-roxo/10 border border-roxo/25 flex items-center justify-center shadow-glow">
              <Icone />
            </div>
            <p className="text-sm text-texto-suave">{texto}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
