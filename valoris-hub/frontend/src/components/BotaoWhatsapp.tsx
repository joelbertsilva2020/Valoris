import { MessageCircle } from 'lucide-react';

export default function BotaoWhatsapp() {
  return (
    <a
      href="https://wa.me/SEU_NUMERO_AQUI?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20minha%20negocia%C3%A7%C3%A3o"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com atendimento humano no WhatsApp"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center
                 bg-[#25D366] text-white shadow-[0_0_24px_rgba(37,211,102,0.45)]
                 hover:scale-105 transition-transform"
    >
      <MessageCircle size={26} strokeWidth={2} fill="white" className="text-[#25D366]" />
    </a>
  );
}
