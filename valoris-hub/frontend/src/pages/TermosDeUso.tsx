import PaginaLegal from '../components/PaginaLegal';

export default function TermosDeUso() {
  return (
    <PaginaLegal titulo="Termos de Uso" atualizadoEm="julho de 2026">
      <section>
        <h2>1. Aceitação</h2>
        <p>
          Ao utilizar o Portal Valoris, você concorda com estes Termos de Uso. Caso não concorde, pedimos
          que não utilize o ambiente.
        </p>
      </section>

      <section>
        <h2>2. O que é o Portal</h2>
        <p>
          O Portal Valoris é um ambiente de negociação que conecta você às instituições credoras
          parceiras, permitindo consultar e regularizar contratos em aberto. A Valoris atua como
          intermediadora tecnológica dessa negociação.
        </p>
      </section>

      <section>
        <h2>3. O que a Valoris não é</h2>
        <p>
          A Valoris não é uma instituição financeira, não concede empréstimos e não exige pagamento
          antecipado para formalizar qualquer negociação.
        </p>
      </section>

      <section>
        <h2>4. Responsabilidades do usuário</h2>
        <p>
          Você é responsável por fornecer informações verdadeiras no cadastro e por conferir os dados
          de qualquer boleto antes de efetuar pagamento.
        </p>
      </section>

      <section>
        <h2>5. Alterações</h2>
        <p>
          Estes termos podem ser atualizados periodicamente. A versão vigente estará sempre disponível
          nesta página.
        </p>
      </section>
    </PaginaLegal>
  );
}
