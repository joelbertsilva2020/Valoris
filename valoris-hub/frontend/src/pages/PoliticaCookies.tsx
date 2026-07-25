import PaginaLegal from '../components/PaginaLegal';

export default function PoliticaCookies() {
  return (
    <PaginaLegal titulo="Política de Cookies" atualizadoEm="julho de 2026">
      <section>
        <h2>1. O que são cookies</h2>
        <p>
          Cookies são pequenos arquivos armazenados no seu navegador que ajudam a lembrar preferências
          e melhorar sua experiência de navegação.
        </p>
      </section>

      <section>
        <h2>2. Como usamos cookies no Portal</h2>
        <p>
          Usamos um armazenamento local do navegador para lembrar que você já visualizou o aviso de
          boas-vindas e segurança, evitando repeti-lo a cada visita. Não usamos cookies de
          rastreamento publicitário.
        </p>
      </section>

      <section>
        <h2>3. Como gerenciar</h2>
        <p>
          Você pode limpar os dados armazenados pelo navegador a qualquer momento, nas configurações
          do próprio navegador.
        </p>
      </section>
    </PaginaLegal>
  );
}
