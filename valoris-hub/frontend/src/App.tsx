import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import NaoEncontrado from './pages/NaoEncontrado';
import Contratos from './pages/Contratos';
import Negociacao from './pages/Negociacao';
import ConfirmarAcordo from './pages/ConfirmarAcordo';
import Sucesso from './pages/Sucesso';
import MeuAcordo from './pages/MeuAcordo';
import Seguranca from './pages/Seguranca';
import CentralAjuda from './pages/CentralAjuda';
import PoliticaPrivacidade from './pages/PoliticaPrivacidade';
import PoliticaCookies from './pages/PoliticaCookies';
import TermosDeUso from './pages/TermosDeUso';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nao-encontrado" element={<NaoEncontrado />} />
        <Route path="/contratos" element={<Contratos />} />
        <Route path="/negociacao" element={<Negociacao />} />
        <Route path="/confirmar-acordo" element={<ConfirmarAcordo />} />
        <Route path="/sucesso" element={<Sucesso />} />
        <Route path="/meu-acordo" element={<MeuAcordo />} />
        <Route path="/seguranca" element={<Seguranca />} />
        <Route path="/central-de-ajuda" element={<CentralAjuda />} />
        <Route path="/privacidade" element={<PoliticaPrivacidade />} />
        <Route path="/cookies" element={<PoliticaCookies />} />
        <Route path="/termos" element={<TermosDeUso />} />
      </Routes>
    </Layout>
  );
}
