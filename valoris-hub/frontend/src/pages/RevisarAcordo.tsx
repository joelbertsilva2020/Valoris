import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { usePortal } from '../state/PortalContext';
import { chamarApi } from '../lib/api';
import { formatarMoeda, formatarData } from '../lib/cpf';
import PortalPainel from '../components/PortalPainel';
import BotaoMarca from '../components/BotaoMarca';
import AvisoSessao from '../components/AvisoSessao';

export default function RevisarAcordo() {
  const navigate = useNavigate();
  const {
    cpf, contratoAtual, propostaEscolhida, diasAtraso,
    canalConfirmacao, setCanalConfirmacao,
    emailConfirmacao, setEmailConfirmacao,
    setAcordoConfirmado,
  } = usePortal();
  const [aceitou, setAceitou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!contratoAtual || !propostaEscolhida) return <AvisoSessao />;

  const p = propostaEscolhida;
  // O CobranSaaS repete a entrada como a primeira posição do array de
  // parcelas — as parcelas "reais" são as que vêm depois dela.
  const parcelasReais = p.entrada ? (p.parcelas || []).slice(1) : p.parcelas || [];
  const totalPagamentos = p.tipo === 'a_vista' ? 1 : (p.parcelas || []).length;
  const valorDesconto = contratoAtual.valorAtualizado - Number(p.valorTotal);

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    if (!aceitou) return;
    if (!emailConfirmacao) {
      setErro('Informe um e-mail válido.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const resultado = await chamarApi<{ id?: string; numeroAcordo?: string; linhaDigitavel?: string; linkPagamento?: string }>(
        '/confirmar-acordo',
        {
          clienteId: contratoAtual!.clienteId,
          contratoId: contratoAtual!.id,
          propostaEscolhida,
          canal: canalConfirmacao,
          email: emailConfirmacao,
          cpf,
        }
      );
      setAcordoConfirmado({
        acordoId: resultado.id || resultado.numeroAcordo || '',
        linhaDigitavel: resultado.linhaDigitavel,
        urlBoleto: resultado.linkPagamento,
      });
      navigate('/sucesso');
    } catch (e: any) {
      setErro(e.message || 'Não foi possível confirmar o acordo agora.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PortalPainel
      rotulo={`Contrato ${contratoAtual.numero}`}
      titulo="Revisar Acordo"
      acaoTopo={
        <button
          onClick={() => navigate('/negociacao')}
          className="flex items-center gap-1.5 text-sm text-white/85 hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft size={15} /> Voltar
        </button>
      }
    >
      <p className="text-claro-suave text-sm mb-6">Confira todas as condições e finalize o acordo.</p>

      <form onSubmit={confirmar} className="max-w-md space-y-4">
        {/* Situação atual da dívida */}
        <div className="bg-claro-superficie border border-claro-linha rounded-xl p-5 space-y-2.5">
          <p className="text-xs uppercase tracking-wide text-claro-suave font-mono mb-1">Situação atual</p>
          <div className="flex justify-between text-sm">
            <span className="text-claro-suave">Contrato</span>
            <span className="text-claro-texto font-mono">{contratoAtual.numero}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-claro-suave">Dívida atual</span>
            <span className="text-claro-texto font-mono">{formatarMoeda(contratoAtual.valorAtualizado)}</span>
          </div>
          {diasAtraso !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-claro-suave">Dias em atraso</span>
              <span className="text-red-600 font-medium">{diasAtraso}</span>
            </div>
          )}
        </div>

        {/* Condições negociadas */}
        <div className="bg-claro-superficie border border-claro-linha rounded-xl p-5 space-y-2.5">
          <p className="text-xs uppercase tracking-wide text-claro-suave font-mono mb-1">Condições negociadas</p>

          <div className="flex justify-between text-sm">
            <span className="text-claro-suave">Forma de pagamento</span>
            <span className="text-claro-texto font-medium">
              {p.tipo === 'a_vista' ? 'À vista' : `Parcelado em ${totalPagamentos}x`}
            </span>
          </div>

          {p.tipo === 'a_vista' && p.vencimentoMaximo && (
            <div className="flex justify-between text-sm">
              <span className="text-claro-suave">Vencimento</span>
              <span className="text-claro-texto font-mono">até {formatarData(p.vencimentoMaximo)}</span>
            </div>
          )}

          {valorDesconto > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-claro-suave">Desconto obtido</span>
              <span className="text-green-600 font-semibold">
                {formatarMoeda(valorDesconto)}
                {p.percentualEconomia !== null && ` (${p.percentualEconomia}%)`}
              </span>
            </div>
          )}

          <div className="h-px bg-claro-linha" />

          <div className="flex justify-between items-center">
            <span className="text-claro-texto font-medium">Total do acordo</span>
            <span className="font-mono text-lg text-claro-texto">{formatarMoeda(p.valorTotal)}</span>
          </div>
        </div>

        {/* Detalhamento parcela a parcela */}
        {p.tipo === 'parcelado' && (p.entrada || parcelasReais.length > 0) && (
          <div className="bg-claro-superficie border border-claro-linha rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-claro-suave font-mono mb-3">Detalhamento dos pagamentos</p>
            <div className="space-y-2">
              {p.entrada && (
                <div className="flex justify-between text-sm">
                  <span className="text-claro-texto">Entrada — {formatarData(p.entrada.vencimento)}</span>
                  <span className="text-claro-texto font-mono">{formatarMoeda(p.entrada.valor)}</span>
                </div>
              )}
              {parcelasReais.map((parcela, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-claro-texto">
                    Parcela {i + 1}/{parcelasReais.length} — {formatarData(parcela.vencimento)}
                  </span>
                  <span className="text-claro-texto font-mono">{formatarMoeda(parcela.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canal e e-mail de contato */}
        <div className="bg-claro-superficie border border-claro-linha rounded-xl p-5 space-y-4">
          <p className="text-xs uppercase tracking-wide text-claro-suave font-mono">Enviar confirmação por</p>
          <div>
            <label className="block text-sm font-medium text-claro-texto mb-1.5">Selecione uma opção</label>
            <select
              value={canalConfirmacao}
              onChange={(e) => setCanalConfirmacao(e.target.value)}
              className="w-full bg-white border border-claro-linha rounded-lg px-3.5 py-2.5 text-claro-texto focus:outline-none focus:border-roxo"
            >
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-claro-texto mb-1.5">Informe seu e-mail</label>
            <input
              type="email"
              required
              value={emailConfirmacao}
              onChange={(e) => setEmailConfirmacao(e.target.value)}
              placeholder="seuemail@exemplo.com.br"
              className="w-full bg-white border border-claro-linha rounded-lg px-3.5 py-2.5 text-claro-texto placeholder:text-claro-suave focus:outline-none focus:border-roxo"
            />
          </div>
        </div>

        <label className="flex items-start gap-3 text-sm text-claro-texto cursor-pointer select-none">
          <span
            onClick={() => setAceitou((v) => !v)}
            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
              aceitou ? 'bg-grad-marca border-transparent' : 'border-claro-linha bg-claro-superficie'
            }`}
          >
            {aceitou && <Check size={13} className="text-white" strokeWidth={3} />}
          </span>
          <span onClick={() => setAceitou((v) => !v)}>
            Li e estou de acordo com as condições desta negociação, incluindo valores e datas de vencimento acima.
          </span>
        </label>

        {erro && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3.5 text-sm break-words">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {erro}
          </div>
        )}

        <BotaoMarca
          full
          type="submit"
          aria-disabled={!aceitou || enviando}
          className={
            !aceitou || enviando
              ? 'opacity-60 saturate-[.4] cursor-not-allowed hover:opacity-75 hover:saturate-50 transition-all'
              : ''
          }
          onClick={(e) => {
            if (!aceitou || enviando) e.preventDefault();
          }}
        >
          {enviando ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Confirmando…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ShieldCheck size={16} /> Confirme o acordo
            </span>
          )}
        </BotaoMarca>
      </form>
    </PortalPainel>
  );
}
