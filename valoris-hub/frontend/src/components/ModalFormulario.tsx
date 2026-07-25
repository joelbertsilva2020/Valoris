import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModalFormulario({
  aberto,
  eyebrow,
  titulo,
  descricao,
  children,
}: {
  aberto: boolean;
  eyebrow: string;
  titulo: string;
  descricao: string;
  children: ReactNode;
}) {
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
            className="card-vidro max-w-md w-full p-8"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-roxo-claro bg-roxo/10 border border-roxo/25 rounded-full px-3 py-1.5 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-azul" /> {eyebrow}
            </span>
            <h2 className="font-display font-semibold text-xl text-texto mb-2">{titulo}</h2>
            <p className="text-texto-suave text-sm mb-5">{descricao}</p>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
