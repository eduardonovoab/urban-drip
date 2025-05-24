import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const { setToken, setUser } = useAuth();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.message || 'Error en login');
        setLoading(false);
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
      setFormError('Error de conexión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg max-w-md w-full p-8"
        noValidate
      >
        <h1 className="text-3xl font-semibold text-blue-900 text-center mb-8 font-sans">
          Iniciar sesión
        </h1>

        {formError && (
          <div className="mb-6 text-center text-red-600 font-medium">
            {formError}
          </div>
        )}

        <div className="mb-6">
          <label
            htmlFor="correo"
            className="block mb-2 font-semibold text-gray-700"
          >
            Correo electrónico
          </label>
          <input
            id="correo"
            type="email"
            placeholder="correo@ejemplo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="mb-2">
          <label
            htmlFor="contrasena"
            className="block mb-2 font-semibold text-gray-700"
          >
            Contraseña
          </label>
          <input
            id="contrasena"
            type="password"
            placeholder="••••••••"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="mb-6 text-right">
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-3 rounded-md shadow transition duration-300 flex justify-center items-center"
        >
          {loading ? (
            <svg
              className="animate-spin h-6 w-6 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          ) : (
            'Entrar'
          )}
        </button>

        <p className="mt-6 text-center text-gray-600 text-sm">
          ¿No tienes una cuenta?{' '}
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Regístrate aquí
          </Link>
        </p>
      </form>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default Login;
