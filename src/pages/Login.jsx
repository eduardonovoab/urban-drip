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
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext); // Asumiendo que tienes una función login en tu contexto

  // Obtener la ruta desde donde vino el usuario (si fue redirigido)
  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validación adicional en el frontend
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

      // Verificar que se recibieron los datos necesarios
      if (!token || !usuario) {
        throw new Error('Respuesta del servidor incompleta');
      }

      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      // Actualizar el contexto de autenticación
      if (login) {
        login(usuario, token);
      }

      console.log('Login exitoso:', usuario);
      
      // Mostrar notificación de éxito
      toast.success(`¡Bienvenido ${usuario.nombre || usuario.correo}!`, {
        position: "top-right",
        autoClose: 3000,
      });

      // Función para manejar la redirección
      const handleRedirection = () => {
        // Si el usuario fue redirigido desde otra página, volver allí
        if (from && from !== '/login') {
          navigate(from, { replace: true });
          return;
        }

        // Redirigir según el rol del usuario
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
            // Limpiar localStorage si el rol no es válido
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            return;
        }
      };

      // Usar setTimeout para asegurar que la redirección ocurra correctamente
      setTimeout(handleRedirection, 100);

    } catch (err) {
      console.error('Error de login:', err);

      // Manejo más específico de errores
      let errorMessage = 'Error de conexión con el servidor';

      if (err.response) {
        // Error del servidor
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
        // Error de red
        errorMessage = 'Sin conexión al servidor. Verifica tu conexión a internet.';
      } else {
        // Error de configuración
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
    </div>
  );
};

export default Login;