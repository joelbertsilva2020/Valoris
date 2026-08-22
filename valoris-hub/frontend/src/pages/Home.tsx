import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ChevronDown } from 'lucide-react';
import { chamarApi } from '../lib/api';
import { validarCpf, limparCpf } from '../lib/cpf';
import { usePortal } from '../state/PortalContext';
import BotaoMarca from '../components/BotaoMarca';
import EsteiraParceiros from '../components/EsteiraParceiros';
import IlustracaoAbstrata from '../components/IlustracaoAbstrata';
import ModalFormulario from '../components/ModalFormulario';
import BeneficiosValoris from '../components/BeneficiosValoris';
import JornadaComoFunciona from '../components/JornadaComoFunciona';

const FAQ = [
  { pergunta: 'É seguro informar meu CPF aqui?', resposta: 'Sim. O Valoris é o ambiente oficial de negociação usado pelos parceiros credenciados, com conexão segura e dados protegidos conforme a LGPD.' },
  { pergunta: 'Preciso pagar para consultar?', resposta: 'Não. A consulta é 100% gratuita e não gera nenhum compromisso.' },
  { pergunta: 'Preciso criar uma senha?', resposta: 'Não. No seu retorno, basta informar CPF e data de nascimento para acessar novamente.' },
];

export default function Home() {
  const navigate = useNavigate();
  const { setCpf, setNome, setContratos, setContratoAtual } = usePortal();

  const [valorCpf, setValorCpf] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [modal, setModal] = useState<'cadastro' | 'validacao' | null>(null);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [enviandoModal, setEnviandoModal] = useState(false);
  const [cpfAtual, setCpfAtual] = useState('');

  async function aoConsultar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    const cpf = limparCpf(valorCpf);
    if (!validarCpf(cpf)) {
      setErro('CPF inválido. Confira os números digitados.');
      return;
    }

    setCarregando(true);
    try {
      const resultado = await chamarApi<{ encontrado: boolean; clienteExistente?: boolean }>('/consultar-cpf', { cpf });
      setCpfAtual(cpf);

      if (!resultado.encontrado) {
        navigate('/nao-encontrado');
        return;
      }

      setModal(resultado.clienteExistente ? 'validacao' : 'cadastro');
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  async function aoCadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroModal(null);
    setEnviandoModal(true);
    const form = evento.currentTarget;
    const dados = new FormData(form);

    try {
      const resultado = await chamarApi<{ nome: string }>('/cadastro', {
        cpf: cpfAtual,
        nome: String(dados.get('nome')),
        dataNascimento: String(dados.get('dataNascimento')),
        email: String(dados.get('email')),
        telefone: String(dados.get('telefone')),
      });

      setCpf(cpfAtual);
      setNome(resultado.nome);
      setModal(null);
      await irParaContratos(cpfAtual);
    } catch (e: any) {
      setErroModal(e.message);
    } finally {
      setEnviandoModal(false);
    }
  }

  async function aoValidar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroModal(null);
    setEnviandoModal(true);
    const form = evento.currentTarget;
    const dados = new FormData(form);

    try {
      const resultado = await chamarApi<{ valido: boolean; nome?: string }>('/validar-retorno', {
        cpf: cpfAtual,
        dataNascimento: String(dados.get('dataNascimento')),
      });

      if (!resultado.valido) {
        setErroModal('Data de nascimento não confere. Tente novamente.');
        return;
      }

      setCpf(cpfAtual);
      setNome(resultado.nome ?? null);
      setModal(null);

      const contratosResp = await chamarApi<{ contratos: any[] }>('/contratos', { cpf: cpfAtual });
      setContratos(contratosResp.contratos);

      if (contratosResp.contratos.length === 0) {
        navigate('/nao-encontrado');
        return;
      }

      const proximo = await chamarApi<{ destino: string; contratoId: string }>('/proximo-passo', {
        cpf: cpfAtual,
        contratos: contratosResp.contratos,
      });

      const contrato = contratosResp.contratos.find((c) => c.id === proximo.contratoId) || contratosResp.contratos[0];
      setContratoAtual(contrato);

      if (proximo.destino === 'acordo-ativo') {
        navigate('/acordo-ativo');
      } else {
        navigate('/contratos');
      }
    } catch (e: any) {
      setErroModal(e.message);
    } finally {
      setEnviandoModal(false);
    }
  }

  async function irParaContratos(cpf: string) {
    const contratosResp = await chamarApi<{ nome: string; contratos: any[] }>('/contratos', { cpf });
    setContratos(contratosResp.contratos);
    navigate('/contratos');
  }

  return (
    <div>
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid sm:grid-cols-[1fr_220px] gap-10 items-center py-6"
      >
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-roxo-claro bg-roxo/10 border border-roxo/25 rounded-full px-3 py-1.5 mb-5">
            <Sparkles size={13} /> Inteligência financeira
          </span>
          <h1 className="font-display font-semibold text-4xl sm:text-5xl leading-tight text-texto mb-4">
            Sua solução <span className="texto-gradiente">financeira</span> começa aqui.
          </h1>
          <p className="text-texto-suave text-base mb-8 max-w-md">
            Uma plataforma inteligente para regularizar seus contratos com segurança, transparência
            e tecnologia — em parceria com as instituições credoras.
          </p>

          <div className="bg-white rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] max-w-sm">
            <h2 className="font-display font-semibold text-2xl text-bg mb-1">
              Negocie com até <span className="texto-gradiente">80% de desconto</span>
            </h2>

            <form onSubmit={aoConsultar} className="mt-4 space-y-3">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Digite seu CPF aqui"
                value={valorCpf}
                onChange={(e) => setValorCpf(e.target.value)}
                className="w-full bg-[#F3F2F7] border border-black/5 rounded-full px-5 py-3.5 text-bg placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-roxo-claro/40"
                required
              />
              <BotaoMarca type="submit" disabled={carregando} full className="!rounded-full">
                {carregando ? 'Consultando…' : 'Consulte Grátis'}
              </BotaoMarca>
            </form>

            <button
              type="button"
              onClick={() => navigate('/acordo-ativo')}
              className="block mt-4 text-sm text-roxo underline underline-offset-2 hover:text-roxo-claro transition-colors"
            >
              Já negociou? Pegar 2ª via de boleto.
            </button>

            {erro && <p className="text-sm text-red-500 mt-3">{erro}</p>}
          </div>
        </div>

        <IlustracaoAbstrata variante="dashboard" className="hidden sm:block" />
      </motion.section>

      {/* Parceiros */}
      <section className="py-14">
        <p className="font-display font-semibold text-xl sm:text-2xl text-texto mb-6 max-w-md">
          Descontos exclusivos para você ficar em dia com os nossos parceiros.
        </p>
        <EsteiraParceiros />
      </section>

      <BeneficiosValoris />

      <JornadaComoFunciona />

      {/* FAQ */}
      <section className="py-10">
        <h2 className="font-display font-semibold text-2xl text-texto mb-6">Perguntas frequentes</h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <details key={i} className="card-vidro p-5 group">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-texto list-none">
                {item.pergunta}
                <ChevronDown size={16} className="text-texto-suave group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-sm text-texto-suave mt-3">{item.resposta}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Modal: Cadastro (1º acesso) */}
      <ModalFormulario
        aberto={modal === 'cadastro'}
        eyebrow="Primeiro acesso"
        titulo="Só mais um passo."
        descricao="Complete seus dados para continuar com segurança."
      >
        <form onSubmit={aoCadastrar} className="space-y-3">
          <Campo label="Nome completo" name="nome" type="text" required />
          <Campo label="Data de nascimento" name="dataNascimento" type="date" required />
          <Campo label="E-mail" name="email" type="email" required />
          <Campo label="Telefone" name="telefone" type="tel" required />
          <BotaoMarca type="submit" full disabled={enviandoModal} className="mt-2">
            {enviandoModal ? 'Enviando…' : 'Continuar'}
          </BotaoMarca>
          {erroModal && <p className="text-sm text-red-400">{erroModal}</p>}
        </form>
      </ModalFormulario>

      {/* Modal: Validação de retorno */}
      <ModalFormulario
        aberto={modal === 'validacao'}
        eyebrow="Bem-vindo de volta"
        titulo="Confirme sua identidade."
        descricao="Para sua segurança, confirme sua data de nascimento."
      >
        <form onSubmit={aoValidar} className="space-y-3">
          <Campo label="Data de nascimento" name="dataNascimento" type="date" required />
          <BotaoMarca type="submit" full disabled={enviandoModal} className="mt-2">
            {enviandoModal ? 'Confirmando…' : 'Confirmar'}
          </BotaoMarca>
          {erroModal && <p className="text-sm text-red-400">{erroModal}</p>}
        </form>
      </ModalFormulario>
    </div>
  );
}

function Campo({ label, name, type, required }: { label: string; name: string; type: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs text-texto-suave">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full bg-white/[0.03] border border-linha rounded-lg px-3.5 py-2.5 text-sm text-texto outline-none focus:border-roxo-claro transition-colors"
      />
    </label>
  );
}
