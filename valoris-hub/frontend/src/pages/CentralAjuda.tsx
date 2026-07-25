import { useMemo, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface Pergunta { pergunta: string; resposta: string; categoria: string }

const CATEGORIAS = ['Todos', 'Negociação', 'Boletos', 'Pagamentos', 'Cadastro', 'Segurança', 'Parceiros', 'Outros'];

const PERGUNTAS: Pergunta[] = [
  { categoria: 'Negociação', pergunta: 'Como consultar minhas propostas?', resposta: 'Na tela inicial do Portal, informe seu CPF e clique em "Consultar propostas". Vamos verificar automaticamente se existe alguma condição especial disponível para você.' },
  { categoria: 'Negociação', pergunta: 'Quando meu acordo aparecerá como ativo?', resposta: 'Assim que a instituição credora confirma a efetivação, o status do seu acordo é atualizado na área "Meu Acordo". Essa informação é sempre consultada em tempo real.' },
  { categoria: 'Negociação', pergunta: 'Meu acordo foi cancelado. O que devo fazer?', resposta: 'Basta acessar o Portal novamente com seu CPF e data de nascimento — vamos te mostrar as propostas disponíveis para uma nova negociação.' },
  { categoria: 'Negociação', pergunta: 'Posso alterar o vencimento?', resposta: 'Alterações de vencimento dependem das condições de cada credor. Fale com nosso time de atendimento para verificar as opções disponíveis para o seu contrato.' },
  { categoria: 'Negociação', pergunta: 'Onde solicito meu termo de quitação?', resposta: 'O termo de quitação é emitido pela instituição credora após a confirmação do pagamento da última parcela. Entre em contato com a gente que te ajudamos a solicitar.' },
  { categoria: 'Boletos', pergunta: 'Como acessar meus boletos?', resposta: 'Na área "Meu Acordo", cada parcela em aberto tem um botão "Emitir boleto" ao lado. Basta clicar para gerar a segunda via.' },
  { categoria: 'Boletos', pergunta: 'Meu boleto venceu. O que acontece?', resposta: 'Parcelas vencidas ficam sinalizadas como "Em atraso" na área "Meu Acordo". Recomendamos regularizar o quanto antes para manter as condições do seu acordo.' },
  { categoria: 'Pagamentos', pergunta: 'Meu pagamento ainda não foi identificado.', resposta: 'A confirmação de pagamentos pode levar até alguns dias úteis, dependendo da forma escolhida. Se o prazo já passou, fale com a gente pelos canais oficiais.' },
  { categoria: 'Pagamentos', pergunta: 'Como funciona o pagamento por Pix quando disponível?', resposta: 'Quando essa opção estiver disponível para o seu contrato, o Portal exibirá os dados do destinatário. Sempre confira essas informações antes de concluir a transação.' },
  { categoria: 'Cadastro', pergunta: 'Como atualizar meus dados?', resposta: 'Fale com nosso time de atendimento informando o dado que precisa ser corrigido. Em breve essa opção também estará disponível diretamente no Portal.' },
  { categoria: 'Cadastro', pergunta: 'Como recuperar o acesso?', resposta: 'O Portal não usa senha. Para acessar novamente, basta informar seu CPF e sua data de nascimento na tela inicial.' },
  { categoria: 'Cadastro', pergunta: 'Como excluir minha conta?', resposta: 'Você pode solicitar a exclusão dos seus dados a qualquer momento pelos nossos canais oficiais, conforme previsto na LGPD.' },
  { categoria: 'Segurança', pergunta: 'O portal é seguro?', resposta: 'Sim. O Valoris é o ambiente oficial de negociação dos nossos parceiros, com conexão segura e tratamento de dados conforme a LGPD. Veja mais na nossa página de Segurança.' },
  { categoria: 'Segurança', pergunta: 'A dívida exibida não pertence a mim.', resposta: 'Isso pode acontecer por divergência de cadastro. Entre em contato com a gente imediatamente para que possamos verificar e corrigir a situação.' },
  { categoria: 'Segurança', pergunta: 'Meu nome será retirado dos órgãos de proteção ao crédito?', resposta: 'Após a quitação do acordo, a atualização junto aos órgãos de proteção ao crédito segue os prazos e procedimentos da instituição credora.' },
  { categoria: 'Parceiros', pergunta: 'Quais parceiros estão disponíveis?', resposta: 'Hoje a Valoris atua em parceria com a Nosso Pay. Novos parceiros serão adicionados progressivamente à plataforma.' },
  { categoria: 'Parceiros', pergunta: 'Posso negociar contratos de empresa (CNPJ)?', resposta: 'No momento, o Portal está disponível para negociação de contratos de pessoa física (CPF). Para CNPJ, fale com nosso time de atendimento.' },
  { categoria: 'Outros', pergunta: 'Como entrar em contato?', resposta: 'Você pode falar com a gente pelo WhatsApp (botão flutuante no canto da tela) ou pelo e-mail meajuda@valorissolucoes.com.br.' },
];

export default function CentralAjuda() {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('Todos');

  const filtradas = useMemo(() => {
    return PERGUNTAS.filter((p) => {
      const bateCategoria = categoria === 'Todos' || p.categoria === categoria;
      const bateBusca = !busca || p.pergunta.toLowerCase().includes(busca.toLowerCase()) || p.resposta.toLowerCase().includes(busca.toLowerCase());
      return bateCategoria && bateBusca;
    });
  }, [busca, categoria]);

  return (
    <div>
      <h1 className="font-display font-semibold text-3xl sm:text-4xl text-texto mb-6 text-center">Como podemos ajudar?</h1>

      <div className="card-vidro flex items-center gap-3 px-4 py-3 mb-8 max-w-lg mx-auto">
        <Search size={18} className="text-texto-suave flex-shrink-0" />
        <input
          type="text"
          placeholder="Busque por um assunto…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 bg-transparent outline-none text-texto placeholder:text-texto-suave/60"
        />
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {CATEGORIAS.map((c) => (
          <button
            key={c}
            onClick={() => setCategoria(c)}
            className={`text-sm px-4 py-2 rounded-full border transition-colors ${
              categoria === c
                ? 'bg-grad-marca text-white border-transparent'
                : 'border-linha text-texto-suave hover:border-roxo-claro hover:text-roxo-claro'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtradas.map((p, i) => (
          <details key={i} className="card-vidro p-5 group">
            <summary className="flex items-center justify-between cursor-pointer font-medium text-texto list-none">
              {p.pergunta}
              <ChevronDown size={16} className="text-texto-suave group-open:rotate-180 transition-transform flex-shrink-0 ml-3" />
            </summary>
            <p className="text-sm text-texto-suave mt-3">{p.resposta}</p>
          </details>
        ))}
        {filtradas.length === 0 && (
          <p className="text-center text-texto-suave py-10">Nenhum resultado para essa busca.</p>
        )}
      </div>
    </div>
  );
}
