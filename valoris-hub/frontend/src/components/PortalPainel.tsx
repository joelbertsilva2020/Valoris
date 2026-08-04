import { ReactNode } from 'react';

interface PortalPainelProps {
  rotulo?: string;
  titulo: string;
  acaoTopo?: ReactNode;
  children: ReactNode;
}

/**
 * Painel claro estilo Cobmais: faixa superior com gradiente da marca
 * (rótulo + título à esquerda, logo do Nosso Pay centralizada, ação/voltar
 * à direita) e corpo em fundo claro. Usado nas telas da jornada de
 * negociação (Contratos, Negociação, Revisar, Confirmar, Sucesso),
 * diferenciando visualmente do site institucional escuro sem precisar
 * mexer no Layout/Header globais.
 */
export default function PortalPainel({ rotulo, titulo, acaoTopo, children }: PortalPainelProps) {
  return (
    <div className="rounded-2xl overflow-hidden border border-linha shadow-2xl">
      <div className="bg-grad-marca px-6 py-5 sm:px-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="min-w-0">
          {rotulo && (
            <p className="text-white/75 text-[11px] font-mono uppercase tracking-wide mb-1">{rotulo}</p>
          )}
          <h1 className="text-white font-display font-semibold text-xl sm:text-2xl truncate">{titulo}</h1>
        </div>
        <span className="bg-white rounded-xl h-14 px-4 flex items-center shadow-sm justify-self-center flex-shrink-0">
          <img src="/parceiros/nosso-pay.png" alt="Nosso Pay" className="h-9 w-auto object-contain" />
        </span>
        <div className="justify-self-end flex-shrink-0">{acaoTopo}</div>
      </div>
      <div className="bg-claro-bg px-5 py-7 sm:px-8 sm:py-9">{children}</div>
    </div>
  );
}
