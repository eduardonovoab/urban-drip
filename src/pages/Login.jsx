import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom'; // Importa Link para redirigir

const Login = () => {
  const { setToken, setUser } = useAuth();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Error en login');
        return;
      }

      setToken(data.token);
      setUser(data.usuario);

      if (data.usuario.rol === 'admin') {
        navigate('/admin');
      } else if (data.usuario.rol === 'cliente') {
        navigate('/cliente');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error('Error de conexión: ' + error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-xl shadow-xl w-full max-w-md"
      >
        <h2 className="text-4xl font-semibold mb-8 text-blue-900 text-center font-sans">
          Iniciar Sesión
        </h2>
        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
          className="w-full p-4 mb-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
          className="w-full p-4 mb-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button
          type="submit"
          className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-4 rounded-lg shadow-md transition duration-300"
        >
          Entrar
        </button>

        {/* Agregar un enlace para ir a la página de registro */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-800">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </form>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default Login;
