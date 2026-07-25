import { ButtonHTMLAttributes, ReactNode } from 'react';

interface BotaoMarcaProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  full?: boolean;
}

export default function BotaoMarca({ children, full, className = '', ...rest }: BotaoMarcaProps) {
  return (
    <button
      className={`botao-marca text-white font-semibold rounded-xl px-7 py-3.5 font-sans ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
