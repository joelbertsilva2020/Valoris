import { ReactNode } from 'react';

export default function PaginaLegal({ titulo, atualizadoEm, children }: { titulo: string; atualizadoEm: string; children: ReactNode }) {
  return (
    <div>
      <h1 className="font-display font-semibold text-3xl text-texto mb-2">{titulo}</h1>
      <p className="text-xs text-texto-suave mb-8">Última atualização: {atualizadoEm}</p>

      <div className="card-vidro p-6 mb-8 text-sm text-texto-suave">
        Este texto foi redigido como base inicial seguindo os princípios da LGPD e deve ser revisado
        pelo time jurídico da Valoris antes de entrar em produção.
      </div>

      <div className="space-y-6 text-sm text-texto-suave leading-relaxed [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-lg [&_h2]:text-texto [&_h2]:mb-2 [&_p]:mb-2">
        {children}
      </div>
    </div>
  );
}
