import { ReactNode } from 'react';

interface PortalPainelProps {
  rotulo?: string;
  titulo: string;
  acaoTopo?: ReactNode;
  children: ReactNode;
}

/**
 * Painel claro estilo Cobmais: faixa superior com gradiente da marca
 * (rótulo + título) e corpo em fundo claro. Usado nas telas da jornada
 * de negociação (Contratos, Negociação, Confirmar Acordo, Sucesso),
 * diferenciando visualmente do site institucional escuro sem precisar
 * mexer no Layout/Header globais.
 */
export default function PortalPainel({ rotulo, titulo, acaoTopo, children }: PortalPainelProps) {
  return (
    <div className="rounded-2xl overflow-hidden border border-linha shadow-2xl">
      <div className="bg-grad-marca px-6 py-5 sm:px-8 flex items-center justify-between gap-4">
        <div>
          {rotulo && (
            <p className="text-white/75 text-[11px] font-mono uppercase tracking-wide mb-1">{rotulo}</p>
          )}
          <h1 className="text-white font-display font-semibold text-xl sm:text-2xl">{titulo}</h1>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="bg-white rounded-lg h-11 px-3 flex items-center shadow-sm">
            <img src="/parceiros/nosso-pay.png" alt="Nosso Pay" className="h-7 w-auto object-contain" />
          </span>
          {acaoTopo}
        </div>
      </div>
      <div className="bg-claro-bg px-5 py-7 sm:px-8 sm:py-9">{children}</div>
    </div>
  );
}
