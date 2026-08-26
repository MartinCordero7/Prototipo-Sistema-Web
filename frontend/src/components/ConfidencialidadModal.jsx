import React, { useState, useEffect } from 'react';

const ConfidencialidadModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Usamos sessionStorage para que el mensaje aparezca 
    // solo una vez por cada vez que abran el navegador
    const hasSeenModal = sessionStorage.getItem('hasSeenConfidencialidad');
    if (!hasSeenModal) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem('hasSeenConfidencialidad', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content form-card">
        <h2 className="form-title" style={{ color: 'var(--accent-color)', marginBottom: '1rem', fontSize: '1.4rem' }}>
          Aviso de Confidencialidad
        </h2>
        <p style={{ textAlign: 'center', lineHeight: '1.6', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          El ingreso de la información en este sistema es de carácter <strong>estrictamente confidencial</strong>. <br/><br/>
          Los datos proporcionados serán utilizados exclusivamente con fines de realizar procesos de regulación y control.
          <br/><br/>
          Para conocer más acerca del tratamiento de sus datos, puede consultar la <a href="https://controlhidrocarburos.gob.ec/wp-content/uploads/downloads/2026/05/Ley-Organica-de-Proteccion-de-Datos-Personales.pdf" target="_blank" rel="noopener noreferrer" style={{color: 'var(--accent-color)', fontWeight: 'bold', textDecoration: 'underline'}}>LEY ORGÁNICA DE PROTECCIÓN DE DATOS PERSONALES</a>.
        </p>
        <button className="btn-submit" onClick={handleClose}>
          He leído y entendido
        </button>
      </div>
    </div>
  );
};

export default ConfidencialidadModal;
