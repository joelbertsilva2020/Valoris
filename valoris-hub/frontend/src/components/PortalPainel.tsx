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
 *
 * Mais largo que o container padrão do site (max-w-3xl) só a partir do
 * desktop (lg) — no mobile continua exatamente do tamanho do container
 * normal, evitando quebra de layout em telas pequenas.
 */
export default function PortalPainel({ rotulo, titulo, acaoTopo, children }: PortalPainelProps) {
  return (
    <div className="lg:relative lg:left-1/2 lg:-translate-x-1/2 lg:w-[56rem]">
      <div className="rounded-2xl overflow-hidden border border-linha shadow-2xl">
        <div className="bg-grad-marca px-6 py-5 sm:px-8 grid grid-cols-[1fr_auto_auto] items-center gap-3 sm:gap-5">
          <div className="min-w-0">
            {rotulo && (
              <p className="text-white/75 text-[11px] font-mono uppercase tracking-wide mb-1">{rotulo}</p>
            )}
            <h1 className="text-white font-display font-semibold text-lg sm:text-2xl truncate">{titulo}</h1>
          </div>
          <span className="bg-white rounded-xl h-11 sm:h-14 px-3 sm:px-4 flex items-center shadow-sm flex-shrink-0">
            <img src="/parceiros/nosso-pay.png" alt="Nosso Pay" className="h-6 sm:h-9 w-auto object-contain" />
          </span>
          <div className="flex-shrink-0">{acaoTopo}</div>
        </div>
        <div className="bg-claro-bg px-5 py-7 sm:px-8 sm:py-9">{children}</div>
      </div>
    </div>
  );
}
