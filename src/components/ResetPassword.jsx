import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../Styles/ResetPassword.css';

const ResetPassword = () => {
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValido, setTokenValido] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { token } = useParams();
  const navigate = useNavigate();

  // Verificar token al cargar el componente
  useEffect(() => {
    if (!token) {
      setTokenValido(false);
      setError('Token de recuperación no válido');
      return;
    }

    // Opcional: Verificar token en el backend
    const verifyToken = async () => {
      try {
        // Puedes crear un endpoint para verificar solo el token sin cambiar la contraseña
        setTokenValido(true);
      } catch (err) {
        setTokenValido(false);
        setError('El enlace de recuperación es inválido o ha expirado');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones
    if (!nuevaContrasena || !confirmarContrasena) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    if (nuevaContrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`http://localhost:3000/api/auth/reset-password/${token}`, {
        nuevaContrasena
      });

      setSuccess(true);
      toast.success('Contraseña restablecida exitosamente', {
        position: "top-right",
        autoClose: 3000,
      });

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Contraseña restablecida. Puedes iniciar sesión con tu nueva contraseña.' 
          }
        });
      }, 3000);

    } catch (err) {
      console.error('Error al restablecer contraseña:', err);

      let errorMessage = 'Error al restablecer la contraseña';

      if (err.response) {
        switch(err.response.status) {
          case 400:
            errorMessage = err.response.data?.message || 'Datos inválidos';
            break;
          case 404:
            errorMessage = 'El enlace de recuperación es inválido o ha expirado';
            break;
          case 500:
            errorMessage = 'Error interno del servidor';
            break;
          default:
            errorMessage = err.response.data?.message || 'Error desconocido';
        }
      }

      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Si el token no es válido
  if (tokenValido === false) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="error-icon">⚠️</div>
          <h2>Enlace inválido</h2>
          <p>{error}</p>
          <div className="reset-actions">
            <Link to="/login" className="back-to-login">
              Volver al login
            </Link>
            <Link to="/login" className="request-new-link">
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Si el reset fue exitoso
  if (success) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="success-icon">✅</div>
          <h2>¡Contraseña restablecida!</h2>
          <p>Tu contraseña ha sido cambiada exitosamente.</p>
          <p>Serás redirigido al login en unos segundos...</p>
          <div className="reset-actions">
            <Link to="/login" className="go-to-login">
              Ir al login ahora
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h2>Restablecer contraseña</h2>
        <p>Ingresa tu nueva contraseña</p>

        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              required
              className="reset-input"
              disabled={loading}
              minLength="6"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Confirmar nueva contraseña"
              value={confirmarContrasena}
              onChange={(e) => setConfirmarContrasena(e.target.value)}
              required
              className="reset-input"
              disabled={loading}
              minLength="6"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="reset-error">{error}</p>}

          <button
            type="submit"
            className="reset-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner-small"></span>
                Restableciendo...
              </>
            ) : (
              'Restablecer contraseña'
            )}
          </button>
        </form>

        <div className="reset-links">
          <Link to="/login" className="back-to-login">
            ← Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;