import React, { useState, useEffect } from 'react';

import { IconShieldAlert } from './Icons';
import Modal from './Modal';

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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Aviso de Confidencialidad"
      icon={<IconShieldAlert />}
      footer={
        <button className="corp-btn corp-btn-primary" onClick={handleClose}>
          He leído y entendido
        </button>
      }
    >
      <p style={{ margin: '0 0 16px 0' }}>
        El ingreso de la información en este sistema es de carácter <strong>estrictamente confidencial</strong>.
      </p>
      <p style={{ margin: '0 0 16px 0' }}>
        Los datos proporcionados serán utilizados exclusivamente con fines de realizar procesos de regulación y control.
      </p>
      <p style={{ margin: 0 }}>
        Para conocer más acerca del tratamiento de sus datos, puede consultar la <a href="https://controlhidrocarburos.gob.ec/proteccion-de-datos-personales/" target="_blank" rel="noopener noreferrer" className="corp-link">Política de Protección de Datos Personales</a>.
      </p>
    </Modal>
  );
};

export default ConfidencialidadModal;
