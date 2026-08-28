import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Login from './components/Login'
import Registro from './components/Registro'
import FormularioES from './components/FormularioES'
import RecuperarPassword from './components/RecuperarPassword'
import ConfidencialidadModal from './components/ConfidencialidadModal'
import ChangePassword from './components/ChangePassword'
import AdminDashboard from './components/AdminDashboard'
import AuditorDashboard from './components/AuditorDashboard'
import logo from '../Images/Logo ARCH Jun 2026.png'

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <img src={logo} alt="Logo ARCH" />
        <h1 className="navbar-title">Sistema de Ingreso de Stock Diario</h1>
      </div>
      <div className="navbar-right">
        {(location.pathname !== '/login' && isAuthenticated) && (
          <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
        )}
      </div>
    </header>
  );
};

const Footer = () => {
  return (
    <footer className="app-footer">
      <hr className="footer-divider" />
      <p>Dirección: Calle Estadio N10-285 y Manuela Cañizares</p>
      <p>Código postal: 170803 / Quito-Ecuador</p>
      <p>Teléfono: 593-2-399-6500</p>
      <p>www.controlhidrocarburos.gob.ec</p>
    </footer>
  );
};

function App() {
  return (
    <Router>
      <Header />
      <ConfidencialidadModal />
      <main className="app-main">
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar" element={<RecuperarPassword />} />
            <Route path="/formulario" element={<FormularioES />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/auditor-dashboard" element={<AuditorDashboard />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </Router>
  )
}

export default App
