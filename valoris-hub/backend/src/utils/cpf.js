/**
 * Validação de CPF pelo dígito verificador — algoritmo oficial (módulo 11).
 * Não confirma que a pessoa existe, só que o número é matematicamente
 * válido. Usado no backend para nunca confiar só na validação do navegador.
 */

function calcularDigito(base) {
  let soma = 0;
  let peso = base.length + 1;
  for (let i = 0; i < base.length; i++) {
    soma += parseInt(base[i], 10) * peso;
    peso--;
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function validarCpf(cpfBruto) {
  const cpf = String(cpfBruto || '').replace(/\D/g, '');

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos os dígitos iguais

  const digito1 = calcularDigito(cpf.slice(0, 9));
  const digito2 = calcularDigito(cpf.slice(0, 9) + digito1);

  return digito1 === parseInt(cpf[9], 10) && digito2 === parseInt(cpf[10], 10);
}

module.exports = { validarCpf };
