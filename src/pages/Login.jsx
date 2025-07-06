import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import '../Styles/Login.css';

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para recuperación de contraseña
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!correo.trim() || !contrasena.trim()) {
      const errorMsg = 'Por favor, completa todos los campos';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        correo: correo.trim(),
        contrasena
      });

      const { token, usuario } = response.data;

      if (!token || !usuario) {
        throw new Error('Respuesta del servidor incompleta');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      if (login) {
        login(usuario, token);
      }

      console.log('Login exitoso:', usuario);
      
      toast.success(`¡Bienvenido ${usuario.nombre || usuario.correo}!`, {
        position: "top-right",
        autoClose: 3000,
      });

      const handleRedirection = () => {
        if (from && from !== '/login') {
          navigate(from, { replace: true });
          return;
        }

        switch(usuario.rol) {
          case 'admin':
            navigate('/admin', { replace: true });
            break;
          case 'cliente':
            navigate('/cliente', { replace: true });
            break;
          default:
            const roleError = 'Rol de usuario no válido';
            setError(roleError);
            toast.error(roleError);
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            return;
        }
      };

      setTimeout(handleRedirection, 100);

    } catch (err) {
      console.error('Error de login:', err);

      let errorMessage = 'Error de conexión con el servidor';

      if (err.response) {
        switch(err.response.status) {
          case 401:
            errorMessage = 'Credenciales incorrectas';
            break;
          case 404:
            errorMessage = 'Usuario no encontrado';
            break;
          case 500:
            errorMessage = 'Error interno del servidor';
            break;
          default:
            errorMessage = err.response.data?.message || `Error ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage = 'Sin conexión al servidor. Verifica tu conexión a internet.';
      } else {
        errorMessage = err.message;
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

  // Función para manejar la recuperación de contraseña
  const handlePasswordRecovery = async (e) => {
    e.preventDefault();
    setRecoveryLoading(true);

    if (!recoveryEmail.trim()) {
      toast.error('Por favor ingresa tu correo electrónico');
      setRecoveryLoading(false);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail.trim())) {
      toast.error('Por favor ingresa un correo electrónico válido');
      setRecoveryLoading(false);
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/auth/forgot-password', {
        correo: recoveryEmail.trim()
      });

      setRecoverySuccess(true);
      toast.success('Se ha enviado un enlace de recuperación a tu correo electrónico', {
        position: "top-right",
        autoClose: 5000,
      });

    } catch (err) {
      console.error('Error en recuperación de contraseña:', err);
      
      let errorMessage = 'Error al enviar el correo de recuperación';
      
      if (err.response) {
        switch(err.response.status) {
          case 404:
            errorMessage = 'No existe una cuenta con este correo electrónico';
            break;
          case 429:
            errorMessage = 'Demasiados intentos. Intenta nuevamente en unos minutos';
            break;
          case 500:
            errorMessage = 'Error interno del servidor';
            break;
          default:
            errorMessage = err.response.data?.message || 'Error en el servidor';
        }
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Función para cerrar el modal y resetear estados
  const closeRecoveryModal = () => {
    setShowRecoveryModal(false);
    setRecoveryEmail('');
    setRecoverySuccess(false);
    setRecoveryLoading(false);
  };

  return (
    <div className="login-container">
      <h2>Iniciar sesión</h2>
      
      {from && (
        <div className="redirect-notice">
          <p>Debes iniciar sesión para acceder a la página solicitada</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="Correo electrónico"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
          className="login-input"
          disabled={loading}
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
          className="login-input"
          disabled={loading}
          minLength="6"
          autoComplete="current-password"
        />
        <button
          type="submit"
          className="login-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner-small"></span>
              Iniciando sesión...
            </>
          ) : (
            'Iniciar sesión'
          )}
        </button>

        {/* Enlace para recuperar contraseña */}
        <div className="forgot-password-link">
          <button
            type="button"
            className="forgot-password-btn"
            onClick={() => setShowRecoveryModal(true)}
            disabled={loading}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </form>
      
      {error && <p className="login-error">{error}</p>}

      <div className="register-link">
        <p>¿No tienes cuenta?</p>
        <Link to="/register">
          <button className="register-button" disabled={loading}>
            Registrarse
          </button>
        </Link>
      </div>
      
      <div className="additional-links">
        <Link to="/" className="home-link">
          ← Volver al inicio
        </Link>
      </div>

      {/* Modal de recuperación de contraseña */}
      {showRecoveryModal && (
        <div className="modal-overlay" onClick={closeRecoveryModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Recuperar contraseña</h3>
              <button
                className="modal-close"
                onClick={closeRecoveryModal}
                disabled={recoveryLoading}
              >
                ×
              </button>
            </div>
            
            {!recoverySuccess ? (
              <form onSubmit={handlePasswordRecovery} className="recovery-form">
                <p className="recovery-description">
                  Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  className="recovery-input"
                  disabled={recoveryLoading}
                  autoComplete="email"
                />
                <div className="modal-buttons">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={closeRecoveryModal}
                    disabled={recoveryLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="send-button"
                    disabled={recoveryLoading}
                  >
                    {recoveryLoading ? (
                      <>
                        <span className="loading-spinner-small"></span>
                        Enviando...
                      </>
                    ) : (
                      'Enviar enlace'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="recovery-success">
                <div className="success-icon">✓</div>
                <h4>¡Correo enviado!</h4>
                <p>
                  Se ha enviado un enlace de recuperación a <strong>{recoveryEmail}</strong>.
                  Revisa tu bandeja de entrada y sigue las instrucciones.
                </p>
                <p className="success-note">
                  Si no recibes el correo en unos minutos, revisa tu carpeta de spam.
                </p>
                <button
                  className="close-success-button"
                  onClick={closeRecoveryModal}
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;