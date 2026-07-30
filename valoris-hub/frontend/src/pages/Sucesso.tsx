import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, ListChecks, Copy } from 'lucide-react';
import { useState } from 'react';
import { usePortal } from '../state/PortalContext';
import PortalPainel from '../components/PortalPainel';
import BotaoMarca from '../components/BotaoMarca';

export default function Sucesso() {
  const navigate = useNavigate();
  const { acordoConfirmado } = usePortal();
  const [copiado, setCopiado] = useState(false);

  if (!acordoConfirmado) {
    navigate('/contratos');
    return null;
  }

  function copiarCodigo() {
    if (!acordoConfirmado?.linhaDigitavel) return;
    navigator.clipboard.writeText(acordoConfirmado.linhaDigitavel).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <PortalPainel rotulo="Tudo certo" titulo="Acordo confirmado">
      <div className="flex flex-col items-center text-center max-w-md mx-auto py-4">
        <span className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-400 flex items-center justify-center mb-5">
          <CheckCircle2 size={32} className="text-green-500" strokeWidth={2} />
        </span>
        <h2 className="font-display font-semibold text-xl text-claro-texto mb-2">Acordo realizado com sucesso!</h2>
        <p className="text-claro-suave text-sm mb-6">
          Enviamos os detalhes para o e-mail informado. Guarde o código abaixo para pagar o boleto.
        </p>

        {acordoConfirmado.linhaDigitavel && (
          <div className="w-full bg-claro-superficie border border-claro-linha rounded-xl p-4 mb-6">
            <p className="text-xs uppercase tracking-wide text-claro-suave font-mono mb-2">
              Utilize o código para realizar o pagamento
            </p>
            <div className="flex items-center gap-2 justify-center">
              <p className="font-mono text-sm sm:text-base text-claro-texto break-all">
                {acordoConfirmado.linhaDigitavel}
              </p>
              <button
                onClick={copiarCodigo}
                className="flex-shrink-0 text-claro-suave hover:text-roxo transition-colors"
                title="Copiar código"
              >
                <Copy size={16} />
              </button>
            </div>
            {copiado && <p className="text-xs text-green-600 mt-1.5">Código copiado!</p>}
          </div>
        )}

        <div className="w-full space-y-3">
          {acordoConfirmado.urlBoleto && (
            <a href={acordoConfirmado.urlBoleto} target="_blank" rel="noreferrer" className="block">
              <BotaoMarca full>
                <span className="flex items-center justify-center gap-2">
                  <FileText size={16} /> Visualizar Boleto
                </span>
              </BotaoMarca>
            </a>
          )}
          <button
            onClick={() => navigate('/meu-acordo')}
            className="w-full flex items-center justify-center gap-2 border border-claro-linha rounded-xl px-6 py-3 text-sm font-medium text-claro-texto hover:border-roxo/40 transition-colors"
          >
            <ListChecks size={16} /> Acompanhe seus acordos
          </button>
        </div>
      </div>
    </PortalPainel>
  );
}
