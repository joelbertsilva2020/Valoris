import { CheckCircle2, Clock, AlertTriangle, XCircle, CircleDashed } from 'lucide-react';

export type SituacaoParcela = 'ABERTO' | 'PARCIAL' | 'LIQUIDADO' | 'CONCLUIDO' | 'CANCELADO';

interface StatusParcelaProps {
  situacao: SituacaoParcela;
  dataVencimento: string; // ISO yyyy-mm-dd
  diasParaAlerta?: number; // padrão 5 — "vencimento próximo"
}

const HOJE = () => new Date().toISOString().slice(0, 10);

function diasEntre(hojeIso: string, vencimentoIso: string) {
  const [ah, mh, dh] = hojeIso.split('-').map(Number);
  const [av, mv, dv] = vencimentoIso.split('-').map(Number);
  const hoje = Date.UTC(ah, mh - 1, dh);
  const venc = Date.UTC(av, mv - 1, dv);
  return Math.round((venc - hoje) / 86400000);
}

/**
 * Deriva a cor/ícone/texto a partir da situação REAL retornada pelo
 * CobranSaaS + data de vencimento — nunca inventa nem sobrescreve a
 * situação que veio da API, só decide como apresentar visualmente.
 */
export function derivarStatusVisual(situacao: SituacaoParcela, dataVencimento: string, diasParaAlerta = 5) {
  if (situacao === 'LIQUIDADO' || situacao === 'CONCLUIDO') {
    return { cor: 'verde', texto: situacao === 'LIQUIDADO' ? 'Pago' : 'Concluído' } as const;
  }
  if (situacao === 'CANCELADO') {
    return { cor: 'cinza', texto: 'Cancelado' } as const;
  }
  if (situacao === 'PARCIAL') {
    return { cor: 'laranja', texto: 'Pagamento parcial' } as const;
  }
  // ABERTO — decide pela data
  const dias = diasEntre(HOJE(), dataVencimento);
  if (dias < 0) return { cor: 'vermelho', texto: 'Vencida' } as const;
  if (dias <= diasParaAlerta) return { cor: 'laranja', texto: 'Vencimento próximo' } as const;
  return { cor: 'amarelo', texto: 'Em aberto' } as const;
}

const ESTILOS: Record<string, { bg: string; texto: string; Icone: typeof CheckCircle2 }> = {
  verde: { bg: 'bg-green-50 border-green-200 text-green-700', texto: 'text-green-700', Icone: CheckCircle2 },
  amarelo: { bg: 'bg-amber-50 border-amber-200 text-amber-700', texto: 'text-amber-700', Icone: Clock },
  laranja: { bg: 'bg-orange-50 border-orange-200 text-orange-700', texto: 'text-orange-700', Icone: AlertTriangle },
  vermelho: { bg: 'bg-red-50 border-red-200 text-red-700', texto: 'text-red-700', Icone: XCircle },
  cinza: { bg: 'bg-gray-100 border-gray-200 text-gray-500', texto: 'text-gray-500', Icone: CircleDashed },
};

export default function StatusParcela({ situacao, dataVencimento, diasParaAlerta }: StatusParcelaProps) {
  const { cor, texto } = derivarStatusVisual(situacao, dataVencimento, diasParaAlerta);
  const { bg, Icone } = ESTILOS[cor];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${bg}`}>
      <Icone size={13} />
      {texto}
    </span>
  );
}
