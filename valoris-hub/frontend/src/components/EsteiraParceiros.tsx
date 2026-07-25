interface Parceiro {
  nome: string;
  logo?: string; // caminho da imagem real, em /public
  selo?: string; // iniciais, para os parceiros ainda mockados
}

const PARCEIROS: Parceiro[] = [
  { nome: 'Nosso Pay', logo: '/parceiros/nosso-pay.png' },
  { nome: 'Grupo DEC Minas', logo: '/parceiros/dec-minas.png' },
  { nome: 'Grupo Supernosso', logo: '/parceiros/supernosso.png' },
  { nome: 'Creditfy', selo: 'CF' },
  { nome: 'Saldo Certo', selo: 'SC' },
];

export default function EsteiraParceiros() {
  const itens = [...PARCEIROS, ...PARCEIROS];

  return (
    <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="flex gap-5 w-max animate-rolar">
        {itens.map((p, i) => (
          <div
            key={i}
            className="card-vidro w-44 h-24 flex items-center justify-center overflow-hidden"
            title={p.nome}
          >
            {p.logo ? (
              <div className="bg-white rounded-xl w-full h-full flex items-center justify-center px-5 py-3">
                <img src={p.logo} alt={p.nome} className="max-w-full max-h-10 object-contain" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-grad-marca flex items-center justify-center font-display font-semibold text-sm text-white flex-shrink-0">
                  {p.selo}
                </span>
                <span className="text-sm font-medium text-texto">{p.nome}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
