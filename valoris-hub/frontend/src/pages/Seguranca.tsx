import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, MessageCircle, Mail, CheckCircle2 } from 'lucide-react';
import IlustracaoAbstrata from '../components/IlustracaoAbstrata';

const BOAS_PRATICAS = [
  'Verifique sempre quem é o beneficiário do boleto.',
  'Confirme as informações antes de efetuar qualquer pagamento.',
  'Nunca realizamos cobranças por depósito ou transferência.',
  'Não oferecemos empréstimos financeiros.',
  'Utilize apenas os canais oficiais da Valoris.',
  'Em caso de dúvida, fale com a gente antes de pagar.',
];

export default function Seguranca() {
  return (
    <div className="space-y-20">
      {/* Bloco 1 */}
      <Bloco
        ilustracao="seguranca"
        eyebrow="Proteção em cada etapa"
        titulo="Sua segurança é prioridade em cada negociação"
        texto="Na Valoris, usamos tecnologia, criptografia e boas práticas de mercado para proteger suas informações durante toda a jornada de negociação — da consulta inicial até a confirmação do seu acordo."
      />

      {/* Bloco 2 */}
      <Bloco
        ilustracao="ia"
        eyebrow="Fique atento"
        titulo="Fique atento a tentativas de fraude"
        texto={(
          <>
            A Valoris não oferece empréstimos, financiamentos ou qualquer serviço que exija pagamento
            antecipado. Caso receba propostas suspeitas usando nosso nome, interrompa imediatamente a
            conversa e entre em contato pelos nossos canais oficiais.
          </>
        )}
        inverso
      />

      {/* Bloco 3 */}
      <motion.section
        className="card-vidro p-8 flex flex-col sm:flex-row gap-6 items-start"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-14 h-14 rounded-2xl bg-dourado/10 border border-dourado/30 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={24} className="text-dourado" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-2xl text-texto mb-2">
            Confira sempre os dados antes de realizar um pagamento
          </h2>
          <p className="text-texto-suave">
            Todos os acordos são formalizados através de boletos emitidos pelo credor ou por
            instituições autorizadas. Quando houver opção de pagamento via Pix, confirme sempre o
            destinatário antes de concluir a transação.
          </p>
        </div>
      </motion.section>

      {/* Bloco 4 */}
      <section>
        <h2 className="font-display font-semibold text-2xl text-texto mb-6">Boas práticas para sua proteção</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {BOAS_PRATICAS.map((texto, i) => (
            <motion.div
              key={i}
              className="card-vidro card-vidro-hover flex gap-3 p-5"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <CheckCircle2 size={18} className="text-roxo-claro flex-shrink-0 mt-0.5" />
              <p className="text-sm text-texto-suave">{texto}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bloco 5 */}
      <section>
        <h2 className="font-display font-semibold text-2xl text-texto mb-6">
          Precisa de ajuda? Nossa equipe está pronta para atender você.
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card-vidro p-6">
            <MessageCircle size={22} className="text-[#25D366] mb-3" />
            <p className="font-semibold text-texto mb-1">WhatsApp</p>
            <p className="text-sm text-texto-suave mb-4">Fale em tempo real com nosso time de atendimento.</p>
            <a
              href="https://wa.me/SEU_NUMERO_AQUI"
              target="_blank"
              rel="noopener noreferrer"
              className="botao-marca inline-block text-white text-sm font-semibold rounded-lg px-5 py-2.5"
            >
              Enviar mensagem
            </a>
          </div>
          <div className="card-vidro p-6">
            <Mail size={22} className="text-azul mb-3" />
            <p className="font-semibold text-texto mb-1">E-mail</p>
            <p className="text-sm text-texto-suave mb-4">meajuda@valorissolucoes.com.br</p>
            <a
              href="mailto:meajuda@valorissolucoes.com.br"
              className="botao-marca inline-block text-white text-sm font-semibold rounded-lg px-5 py-2.5"
            >
              Enviar e-mail
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function Bloco({ ilustracao, eyebrow, titulo, texto, inverso }: {
  ilustracao: 'seguranca' | 'ia' | 'dashboard' | 'documentos' | 'conexoes';
  eyebrow: string;
  titulo: string;
  texto: ReactNode;
  inverso?: boolean;
}) {
  return (
    <motion.section
      className={`grid sm:grid-cols-[200px_1fr] gap-8 items-center ${inverso ? 'sm:[direction:rtl]' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
    >
      <IlustracaoAbstrata variante={ilustracao} />
      <div style={{ direction: 'ltr' }}>
        <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-roxo-claro bg-roxo/10 border border-roxo/25 rounded-full px-3 py-1.5 mb-4">
          <ShieldCheck size={13} /> {eyebrow}
        </span>
        <h2 className="font-display font-semibold text-2xl text-texto mb-3">{titulo}</h2>
        <p className="text-texto-suave">{texto}</p>
      </div>
    </motion.section>
  );
}
