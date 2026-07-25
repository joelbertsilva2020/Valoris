import { motion } from 'framer-motion';
import { ShieldCheck, Fingerprint, BarChart3, FileCheck2, Network } from 'lucide-react';

type Variante = 'dashboard' | 'seguranca' | 'ia' | 'documentos' | 'conexoes';

const ICONE: Record<Variante, typeof ShieldCheck> = {
  dashboard: BarChart3,
  seguranca: ShieldCheck,
  ia: Fingerprint,
  documentos: FileCheck2,
  conexoes: Network,
};

export default function IlustracaoAbstrata({ variante = 'dashboard', className = '' }: { variante?: Variante; className?: string }) {
  const Icone = ICONE[variante];

  return (
    <div className={`relative aspect-square rounded-3xl overflow-hidden card-vidro ${className}`}>
      {/* fundo com grade holográfica + glows */}
      <div className="absolute inset-0 bg-bg-alt" />
      <div className="absolute inset-0 grade-holografica" />
      <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-grad-radial-roxo blur-2xl" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-grad-radial-azul blur-2xl" />

      {/* linhas de conexão */}
      <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 200 200">
        <motion.path
          d="M20,160 C60,120 80,140 100,100 S150,60 180,40"
          fill="none"
          stroke="url(#linhaGrad)"
          strokeWidth="1.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, ease: 'easeInOut' }}
        />
        <defs>
          <linearGradient id="linhaGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6C3BFF" />
            <stop offset="100%" stopColor="#36A8FF" />
          </linearGradient>
        </defs>
      </svg>

      {/* pontos flutuantes */}
      <motion.span
        className="absolute top-10 right-12 w-2 h-2 rounded-full bg-roxo-claro shadow-glow"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="absolute bottom-16 left-14 w-1.5 h-1.5 rounded-full bg-azul shadow-glow-azul"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      />

      {/* card central flutuante com o ícone */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="card-vidro w-20 h-20 flex items-center justify-center border-roxo-claro/30">
          <Icone size={30} className="text-roxo-claro" strokeWidth={1.6} />
        </div>
      </motion.div>
    </div>
  );
}
