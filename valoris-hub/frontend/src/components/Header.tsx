import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Sparkle, ChevronDown, Receipt, HelpCircle } from 'lucide-react';
import { usePortal } from '../state/PortalContext';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { reiniciar } = usePortal();
  const naTelaInicial = location.pathname === '/';
  const [menuAberto, setMenuAberto] = useState(false);

  function irParaInicio() {
    reiniciar();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-bg/70 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" onClick={reiniciar} className="flex items-center gap-2 font-display font-semibold text-lg text-texto">
          <Sparkle size={18} className="text-roxo-claro" strokeWidth={2.2} />
          valoris
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="relative"
            onMouseEnter={() => setMenuAberto(true)}
            onMouseLeave={() => setMenuAberto(false)}
          >
            <button className="flex items-center gap-1.5 text-sm text-texto-suave hover:text-texto transition-colors px-2 py-2">
              O que você precisa?
              <ChevronDown size={14} className={`transition-transform ${menuAberto ? 'rotate-180' : ''}`} />
            </button>

            {menuAberto && (
              <div className="absolute right-0 top-full pt-2 w-56">
                <div className="card-vidro overflow-hidden py-1.5">
                  <Link
                    to="/meu-acordo"
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-texto-suave hover:text-texto hover:bg-white/[0.04] transition-colors"
                  >
                    <Receipt size={15} className="text-roxo-claro" /> 2ª via de boleto
                  </Link>
                  <Link
                    to="/central-de-ajuda"
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-texto-suave hover:text-texto hover:bg-white/[0.04] transition-colors"
                  >
                    <HelpCircle size={15} className="text-azul" /> Central de Ajuda
                  </Link>
                </div>
              </div>
            )}
          </div>

          {!naTelaInicial && (
            <button
              onClick={irParaInicio}
              className="flex items-center gap-1.5 text-sm text-texto-suave border border-linha rounded-full px-4 py-2 hover:border-roxo-claro hover:text-roxo-claro transition-colors"
            >
              <ArrowLeft size={14} /> Início
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
