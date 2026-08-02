import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import PortalPainel from './PortalPainel';

/**
 * Mostrado quando uma tela da jornada (Negociação, Revisar, Confirmar,
 * Sucesso) é aberta sem os dados necessários no estado — o caso mais comum
 * é o cliente atualizar a página (F5), o que reinicia o estado em memória.
 * Em vez de uma tela em branco ou um redirecionamento silencioso, avisa e
 * manda pro início depois de alguns segundos.
 */
export default function AvisoSessao() {
  const navigate = useNavigate();

  useEffect(() => {
    const tempo = setTimeout(() => navigate('/'), 3000);
    return () => clearTimeout(tempo);
  }, [navigate]);

  return (
    <PortalPainel rotulo="Sessão reiniciada" titulo="Vamos recomeçar">
      <div className="flex flex-col items-center text-center py-6">
        <span className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center mb-4">
          <RefreshCw size={24} className="text-amber-500" />
        </span>
        <p className="text-claro-texto font-medium mb-1">Seus dados não foram salvos</p>
        <p className="text-claro-suave text-sm max-w-sm">
          Isso pode acontecer se a página foi atualizada durante a negociação. Você será redirecionado
          para o início em instantes — nenhum acordo foi criado.
        </p>
      </div>
    </PortalPainel>
  );
}
