type StatusParcela = 'a_vencer' | 'vence_hoje' | 'em_atraso' | 'paga';

const CONFIG: Record<StatusParcela, { rotulo: string; cor: string; glow: string; texto: string }> = {
  a_vencer: { rotulo: 'A vencer', cor: '#00E5FF', glow: 'rgba(0,229,255,0.85)', texto: '#5FD8E8' },
  vence_hoje: { rotulo: 'Vence hoje', cor: '#FFD400', glow: 'rgba(255,212,0,0.85)', texto: '#E8C94A' },
  em_atraso: { rotulo: 'Em atraso', cor: '#FF2D55', glow: 'rgba(255,45,85,0.85)', texto: '#FF6B87' },
  paga: { rotulo: 'Pago', cor: '#00FF85', glow: 'rgba(0,255,133,0.85)', texto: '#4CFFA6' },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status as StatusParcela] ?? CONFIG.a_vencer;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-mono font-medium uppercase tracking-wide"
      style={{ color: cfg.texto, background: `${cfg.cor}1A` }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: cfg.cor, boxShadow: `0 0 6px 2px ${cfg.glow}, 0 0 14px 4px ${cfg.glow}` }}
      />
      {cfg.rotulo}
    </span>
  );
}
