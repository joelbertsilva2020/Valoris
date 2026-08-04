import { createContext, useContext, useState, ReactNode } from 'react';

export interface Contrato {
  id: string;
  clienteId: string;
  parceiroSlug?: string;
  numero: string;
  descricao: string;
  valorAtualizado: number;
  diasAtraso?: number;
  mensagem?: string;
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

export interface AcordoConfirmado {
  acordoId: string;
  linhaDigitavel?: string;
  urlBoleto?: string;
}

interface PortalState {
  cpf: string | null;
  nome: string | null;
  contratos: Contrato[];
  contratoAtual: Contrato | null;
  propostaEscolhida: Proposta | null;
  diasAtraso: number | null;
  canalConfirmacao: string;
  emailConfirmacao: string;
  acordoConfirmado: AcordoConfirmado | null;
  setCpf: (cpf: string | null) => void;
  setNome: (nome: string | null) => void;
  setContratos: (contratos: Contrato[]) => void;
  setContratoAtual: (contrato: Contrato | null) => void;
  setPropostaEscolhida: (proposta: Proposta | null) => void;
  setDiasAtraso: (dias: number | null) => void;
  setCanalConfirmacao: (canal: string) => void;
  setEmailConfirmacao: (email: string) => void;
  setAcordoConfirmado: (acordo: AcordoConfirmado | null) => void;
  reiniciar: () => void;
}

const PortalContext = createContext<PortalState | null>(null);

export function PortalProvider({ children }: { children: ReactNode }) {
  const [cpf, setCpf] = useState<string | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contratoAtual, setContratoAtual] = useState<Contrato | null>(null);
  const [propostaEscolhida, setPropostaEscolhida] = useState<Proposta | null>(null);
  const [diasAtraso, setDiasAtraso] = useState<number | null>(null);
  const [canalConfirmacao, setCanalConfirmacao] = useState<string>('email');
  const [emailConfirmacao, setEmailConfirmacao] = useState<string>('');
  const [acordoConfirmado, setAcordoConfirmado] = useState<AcordoConfirmado | null>(null);

  const reiniciar = () => {
    setCpf(null);
    setNome(null);
    setContratos([]);
    setContratoAtual(null);
    setPropostaEscolhida(null);
    setDiasAtraso(null);
    setCanalConfirmacao('email');
    setEmailConfirmacao('');
    setAcordoConfirmado(null);
  };

  return (
    <PortalContext.Provider
      value={{
        cpf, nome, contratos, contratoAtual, propostaEscolhida, diasAtraso,
        canalConfirmacao, emailConfirmacao, acordoConfirmado,
        setCpf, setNome, setContratos, setContratoAtual, setPropostaEscolhida, setDiasAtraso,
        setCanalConfirmacao, setEmailConfirmacao, setAcordoConfirmado,
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
