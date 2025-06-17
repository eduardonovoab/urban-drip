import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../Styles/Register.css';

function validarRut(rutCompleto) {
  rutCompleto = rutCompleto.replace(/\./g, '').replace('-', '');
  if (!/^\d{7,8}[0-9kK]$/.test(rutCompleto)) return false;

  let cuerpo = rutCompleto.slice(0, -1);
  let dv = rutCompleto.slice(-1).toLowerCase();

  let suma = 0,
    multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(cuerpo.charAt(i), 10);
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  let dvEsperado = 11 - (suma % 11);
  dvEsperado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'k' : dvEsperado.toString();

  return dv === dvEsperado;
}

const Register = () => {
  const navigate = useNavigate();

  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);

  const [form, setForm] = useState({
    nombre_usuario: '',
    apellido_usuario: '',
    correo: '',
    contrasena: '',
    rol: 'cliente',
    rut: '',
    direccion: '',
    region_id_region: '',
    comuna_id: '',
    estado_usuario: 'Activo'
  });

  useEffect(() => {
    fetch('http://localhost:3000/api/location/regiones')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        // Verificar que data sea un array
        if (Array.isArray(data)) {
          setRegiones(data);
        } else {
          console.error('Datos de regiones no válidos:', data);
          setRegiones([]);
        }
      })
      .catch((error) => {
        console.error('Error al cargar regiones:', error);
        setRegiones([]);
        toast.error('Error al cargar las regiones');
      });
  }, []);

  useEffect(() => {
    if (form.region_id_region) {
      fetch(`http://localhost:3000/api/location/comunas/${form.region_id_region}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => {
          // Verificar que data sea un array
          if (Array.isArray(data)) {
            setComunas(data);
          } else {
            console.error('Datos de comunas no válidos:', data);
            setComunas([]);
          }
        })
        .catch((error) => {
          console.error('Error al cargar comunas:', error);
          setComunas([]);
          toast.error('Error al cargar las comunas');
        });
    } else {
      setComunas([]);
      setForm((f) => ({ ...f, comuna_id: '' }));
    }
  }, [form.region_id_region]);

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!validarRut(form.rut)) {
      toast.error('RUT inválido');
      return;
    }
    if (!validateEmail(form.correo)) {
      toast.error('Correo inválido');
      return;
    }
    if (form.contrasena.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (!form.region_id_region || !form.comuna_id) {
      toast.error('Debes seleccionar región y comuna');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/usuario/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          comuna_id_comuna: form.comuna_id
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Error en el registro');
        return;
      }

      toast.success('Usuario registrado correctamente. Por favor inicia sesión.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      toast.error('Error de conexión: ' + error.message);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="form-register">
        <h2 className="form-title">Registro de Usuario</h2>

        <input
          name="nombre_usuario"
          placeholder="Nombre"
          value={form.nombre_usuario}
          onChange={handleChange}
          required
          className="input-field"
        />
        <input
          name="apellido_usuario"
          placeholder="Apellido"
          value={form.apellido_usuario}
          onChange={handleChange}
          required
          className="input-field"
        />
        <input
          name="correo"
          type="email"
          placeholder="Correo"
          value={form.correo}
          onChange={handleChange}
          required
          className="input-field"
        />
        <input
          name="contrasena"
          type="password"
          placeholder="Contraseña (mín 8 caracteres)"
          value={form.contrasena}
          onChange={handleChange}
          required
          className="input-field"
        />
        <input
          name="rut"
          placeholder="RUT (ej: 12.345.678-9)"
          value={form.rut}
          onChange={handleChange}
          required
          className="input-field"
        />
        <input
          name="direccion"
          placeholder="Dirección"
          value={form.direccion}
          onChange={handleChange}
          required
          className="input-field"
        />

        <select
          name="region_id_region"
          value={form.region_id_region}
          onChange={handleChange}
          required
          className="input-field"
        >
          <option value="">Selecciona Región</option>
          {Array.isArray(regiones) && regiones.map((r) => (
            <option key={r.id_region} value={r.id_region}>
              {r.nombre_region}
            </option>
          ))}
        </select>

        <select
          name="comuna_id"
          value={form.comuna_id}
          onChange={handleChange}
          disabled={!form.region_id_region}
          required
          className="input-field"
        >
          <option value="">Selecciona Comuna</option>
          {Array.isArray(comunas) && comunas.map((c) => (
            <option key={c.id_comuna} value={c.id_comuna}>
              {c.nombre_comuna}
            </option>
          ))}
        </select>

        <button type="submit" className="submit-button">
          Registrarse
        </button>
      </form>
      <ToastContainer position="top-center" autoClose={3000} />
    </>
  );
};

export default Register;