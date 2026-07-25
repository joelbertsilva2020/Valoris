import { createContext, useContext, useState, ReactNode } from 'react';

export interface Contrato {
  id: string;
  parceiroSlug: string;
  numero: string;
  descricao: string;
  valorAtualizado: number;
  mensagem: string;
}

export interface ParcelaProposta {
  numero: number;
  valor: number;
  vencimento: string;
}

export interface Proposta {
  id: string;
  tipo: 'a_vista' | 'parcelado';
  valorTotal: number;
  percentualEconomia: number | null;
  vencimentoMaximo?: string;
  entrada?: { valor: number; vencimento: string };
  parcelas?: ParcelaProposta[];
}

interface PortalState {
  cpf: string | null;
  nome: string | null;
  contratos: Contrato[];
  contratoAtual: Contrato | null;
  propostaEscolhida: Proposta | null;
  setCpf: (cpf: string | null) => void;
  setNome: (nome: string | null) => void;
  setContratos: (contratos: Contrato[]) => void;
  setContratoAtual: (contrato: Contrato | null) => void;
  setPropostaEscolhida: (proposta: Proposta | null) => void;
  reiniciar: () => void;
}

const PortalContext = createContext<PortalState | null>(null);

export function PortalProvider({ children }: { children: ReactNode }) {
  const [cpf, setCpf] = useState<string | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contratoAtual, setContratoAtual] = useState<Contrato | null>(null);
  const [propostaEscolhida, setPropostaEscolhida] = useState<Proposta | null>(null);

  const reiniciar = () => {
    setCpf(null);
    setNome(null);
    setContratos([]);
    setContratoAtual(null);
    setPropostaEscolhida(null);
  };

  return (
    <PortalContext.Provider
      value={{
        cpf, nome, contratos, contratoAtual, propostaEscolhida,
        setCpf, setNome, setContratos, setContratoAtual, setPropostaEscolhida,
        reiniciar,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal precisa estar dentro de <PortalProvider>');
  return ctx;
}
