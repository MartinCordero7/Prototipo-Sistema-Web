import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FormularioES from '../components/FormularioES';

// Mock del objeto de sesión global (localStorage)
const mockUser = {
  nombre_estacion: 'ESTACION TEST',
  comercializadora: 'PRIMAX',
  correo: 'test@example.com'
};

beforeEach(() => {
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('userData', JSON.stringify(mockUser));
  // Mockeamos la función fetch para que simule la hora de cierre
  global.fetch = vi.fn((url) => {
    if (url.includes('/api/auth/config')) {
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, horaCierre: 20 }) // Simulamos que cierra a las 20:00 (8PM)
      });
    }
    return Promise.resolve({
      json: () => Promise.resolve({ success: true })
    });
  });
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('FormularioES - Ingreso Diario de Operaciones', () => {
  it('debe renderizar el formulario correctamente con los datos del usuario', async () => {
    render(
      <BrowserRouter>
        <FormularioES />
      </BrowserRouter>
    );

    // Debe mostrar el nombre del centro y la comercializadora sacados del localStorage
    expect(screen.getByText('ESTACION TEST')).toBeInTheDocument();
    expect(screen.getByText('PRIMAX')).toBeInTheDocument();
    
    // Debe tener los campos esenciales
    expect(screen.getByLabelText(/Fecha y Hora/i)).toBeInTheDocument();
    expect(screen.getByText(/Diésel Premium/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registrar e Informar Datos/i })).toBeInTheDocument();
  });

  it('debe mostrar errores de validación si se envía vacío', async () => {
    render(
      <BrowserRouter>
        <FormularioES />
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Registrar e Informar Datos/i });
    fireEvent.click(submitBtn);

    // Validar que salgan los mensajes de error (que están implementados localmente en el componente)
    expect(await screen.findByText('Seleccione fecha y hora')).toBeInTheDocument();
    expect(screen.getByText('Debe seleccionar al menos un producto')).toBeInTheDocument();
    expect(screen.getByText('Debe aceptar los términos')).toBeInTheDocument();
  });
});
