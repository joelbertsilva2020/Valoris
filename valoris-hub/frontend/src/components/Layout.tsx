import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import BotaoWhatsapp from './BotaoWhatsapp';
import ModalBoasVindas from './ModalBoasVindas';
import AvisoCookies from './AvisoCookies';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* glows de fundo fixos */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-grad-radial-roxo blur-3xl opacity-70" />
        <div className="absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full bg-grad-radial-azul blur-3xl opacity-60" />
      </div>

      <div className="relative z-10">
        <Header />
        <main className="max-w-3xl mx-auto px-6 pt-12 pb-24">{children}</main>
        <Footer />
      </div>

      <BotaoWhatsapp />
      <ModalBoasVindas />
      <AvisoCookies />
    </div>
  );
}
