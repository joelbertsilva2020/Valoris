export function limparCpf(valor: string): string {
  return String(valor || '').replace(/\D/g, '');
}

export function validarCpf(cpfBruto: string): boolean {
  const cpf = limparCpf(cpfBruto);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcularDigito = (base: string) => {
    let soma = 0;
    let peso = base.length + 1;
    for (let i = 0; i < base.length; i++) {
      soma += parseInt(base[i], 10) * peso;
      peso--;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const digito1 = calcularDigito(cpf.slice(0, 9));
  const digito2 = calcularDigito(cpf.slice(0, 9) + digito1);

  return digito1 === parseInt(cpf[9], 10) && digito2 === parseInt(cpf[10], 10);
}

export function formatarMoeda(valor: number): string {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarData(isoDate: string): string {
  const [ano, mes, dia] = isoDate.split('-');
  return `${dia}/${mes}/${ano}`;
}
