import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../Styles/Login.css'; // Importa el archivo CSS para estilos

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:3000/api/login', { correo, contrasena });

      const { token, usuario } = response.data;

      // Guardar el token en el localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      // Redirigir dependiendo del rol
      if (usuario.rol === 'admin') {
        navigate('/admin');
      } else if (usuario.rol === 'cliente') {
        navigate('/cliente');
      } else {
        toast.error('Rol de usuario no válido');
      }
    } catch (err) {
      setError('Error de login: ' + err.response.data.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
          className="login-input"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
          className="login-input"
        />
        <button type="submit" className="login-button">Iniciar sesión</button>
      </form>
      {error && <p className="login-error">{error}</p>}

      {/* Enlace para ir al formulario de registro */}
      <div className="register-link">
        <p>¿No tienes cuenta?</p>
        <Link to="/register">
          <button className="register-button">Registrarse</button>
        </Link>
      </div>
    </div>
  );
};

export default Login;
