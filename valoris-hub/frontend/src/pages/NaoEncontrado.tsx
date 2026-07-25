import { useNavigate } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import BotaoMarca from '../components/BotaoMarca';

export default function NaoEncontrado() {
  const navigate = useNavigate();

  return (
    <div className="text-center py-10">
      <div className="w-14 h-14 mx-auto mb-6 rounded-full card-vidro flex items-center justify-center">
        <SearchX size={24} className="text-texto-suave" />
      </div>
      <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-roxo-claro bg-roxo/10 border border-roxo/25 rounded-full px-3 py-1.5 mb-5">
        Resultado da consulta
      </span>
      <h1 className="font-display font-semibold text-3xl text-texto mb-3">Nenhuma oportunidade encontrada.</h1>
      <p className="text-texto-suave mb-8 max-w-md mx-auto">
        Não encontramos pendências com condições especiais para o CPF informado no momento.
      </p>
      <BotaoMarca onClick={() => navigate('/')}>Consultar outro CPF</BotaoMarca>
    </div>
  );
}
