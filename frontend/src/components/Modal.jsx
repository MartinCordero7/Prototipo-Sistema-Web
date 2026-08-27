import React from 'react';
import { IconClose } from './Icons';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  icon, 
  children, 
  footer, 
  maxWidth = '500px' 
}) => {
  if (!isOpen) return null;

  return (
    <div className="corp-modal-overlay">
      <div className="corp-modal-card" style={{ maxWidth }}>
        <div className="corp-modal-header">
          <h2 className="corp-modal-title" style={{ color: '#0f172a' }}>
            {icon && <span style={{ color: '#0f172a' }}>{icon}</span>}
            {title}
          </h2>
          {onClose && (
            <button onClick={onClose} className="corp-modal-close" aria-label="Cerrar modal">
              <IconClose />
            </button>
          )}
        </div>

        <div className="corp-modal-body">
          {children}
        </div>

        {footer && (
          <div className="corp-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
