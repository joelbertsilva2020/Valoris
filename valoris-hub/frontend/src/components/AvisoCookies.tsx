import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BotaoMarca from './BotaoMarca';

const CHAVE_COOKIES = 'valoris_cookies_escolha';

export default function AvisoCookies() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const escolha = localStorage.getItem(CHAVE_COOKIES);
    if (!escolha) setVisivel(true);
  }, []);

  function decidir(valor: 'aceitar' | 'rejeitar') {
    localStorage.setItem(CHAVE_COOKIES, valor);
    setVisivel(false);
  }

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2.5rem)] max-w-xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3 }}
        >
          <div className="card-vidro p-5 flex flex-col sm:flex-row items-center gap-4">
            <p className="text-sm text-texto-suave text-center sm:text-left">
              O site da Valoris utiliza cookies para melhorar sua experiência e segurança. Você pode
              aceitar ou rejeitar clicando nos botões. Para mais informações, consulte nossas{' '}
              <Link to="/privacidade" className="text-roxo-claro underline underline-offset-2">Políticas de Privacidade</Link>
              {' '}e de{' '}
              <Link to="/cookies" className="text-roxo-claro underline underline-offset-2">Cookies</Link>.
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => decidir('rejeitar')}
                className="text-sm text-texto-suave border border-linha rounded-full px-4 py-2 hover:border-roxo-claro hover:text-roxo-claro transition-colors whitespace-nowrap"
              >
                Rejeitar
              </button>
              <BotaoMarca onClick={() => decidir('aceitar')} className="!px-4 !py-2 text-sm whitespace-nowrap">
                Aceitar
              </BotaoMarca>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
