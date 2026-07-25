import { Link } from 'react-router-dom';
import { ShieldCheck, Lock } from 'lucide-react';

const LINKS = [
  { rotulo: 'Central de Ajuda', para: '/central-de-ajuda' },
  { rotulo: 'Segurança', para: '/seguranca' },
  { rotulo: 'Política de Privacidade', para: '/privacidade' },
  { rotulo: 'Política de Cookies', para: '/cookies' },
  { rotulo: 'Termos de Uso', para: '/termos' },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-24">
      <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col items-center gap-6 text-center">
        <div className="flex flex-wrap gap-3 justify-center">
          <span className="flex items-center gap-1.5 text-xs text-texto-suave card-vidro px-3 py-1.5 rounded-full">
            <Lock size={12} className="text-roxo-claro" /> Ambiente seguro
          </span>
          <span className="flex items-center gap-1.5 text-xs text-texto-suave card-vidro px-3 py-1.5 rounded-full">
            <ShieldCheck size={12} className="text-azul" /> Conforme a LGPD
          </span>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-texto-suave">
          {LINKS.map((l) => (
            <Link key={l.para} to={l.para} className="hover:text-roxo-claro transition-colors">
              {l.rotulo}
            </Link>
          ))}
        </nav>

        <div className="text-xs text-texto-suave/70 space-y-1">
          <p>© 2026 Valoris Inteligência Financeira. Todos os direitos reservados.</p>
          <p>meajuda@valorissolucoes.com.br · WhatsApp: (00) 00000-0000</p>
        </div>
      </div>
    </footer>
  );
}
