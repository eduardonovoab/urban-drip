import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Cliente = () => {
  const [historialPedidos, setHistorialPedidos] = useState([]);
  const [modificarDatos, setModificarDatos] = useState(false);
  const [usuario, setUsuario] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    contrasena: '',
    direccion: '',
    ciudad: '',
    region_id: '',
    comuna_id: '',
  });
  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);
useEffect(() => {
  // Verificar si existe el token
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No se encontró token en localStorage');
    toast.error('No estás autenticado. Por favor inicia sesión.');
    return;
  }
  
  console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');

  // Cargar historial de pedidos
  const fetchHistorialPedidos = async () => {
    try {
      const url = 'http://localhost:3000/api/cliente/historial-pedidos';
      console.log('🚀 Obteniendo historial de pedidos desde:', url);
      
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ Historial de pedidos cargado:', res.data);
      setHistorialPedidos(res.data);
    } catch (err) {
      console.error('❌ Error completo:', err);
      console.error('❌ Respuesta del error:', err.response?.data);
      console.error('❌ Estado del error:', err.response?.status);
      console.error('❌ Mensaje del error:', err.message);
      
      if (err.response?.status === 401) {
        toast.error('Token expirado. Por favor inicia sesión nuevamente.');
        localStorage.removeItem('token');
        // Opcional: redirigir al login
        // window.location.href = '/login';
      } else if (err.response?.status === 500) {
        toast.error('Error del servidor. Revisa la consola del backend.');
        console.error('🔍 Error 500 - Revisa los logs del servidor backend');
      } else {
        toast.error('No se pudo cargar el historial de pedidos');
      }
    }
  };

  // Cargar los datos del usuario
  const fetchUsuario = async () => {
    try {
      const url = 'http://localhost:3000/api/cliente/datos';
      console.log('🚀 Obteniendo datos del usuario desde:', url);

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ Datos del usuario cargados:', res.data);
      setUsuario(res.data);
    } catch (err) {
      console.error('❌ Error completo:', err);
      console.error('❌ Respuesta del error:', err.response?.data);
      console.error('❌ Estado del error:', err.response?.status);
      console.error('❌ Mensaje del error:', err.message);
      
      if (err.response?.status === 401) {
        toast.error('Token expirado. Por favor inicia sesión nuevamente.');
        localStorage.removeItem('token');
        // Opcional: redirigir al login
        // window.location.href = '/login';
      } else if (err.response?.status === 500) {
        toast.error('Error del servidor. Revisa la consola del backend.');
        console.error('🔍 Error 500 - Revisa los logs del servidor backend');
      } else {
        toast.error('No se pudo cargar los datos del usuario');
      }
    }
  };

  // Llamar a las funciones para cargar datos
  fetchHistorialPedidos();
  fetchUsuario();
}, []);

// También agrega este useEffect para cargar las regiones inicialmente
useEffect(() => {
  const fetchRegiones = async () => {
    try {
      console.log('🚀 Cargando regiones...');
      const res = await axios.get('http://localhost:3000/api/location/regiones');
      console.log('✅ Regiones cargadas:', res.data);
      setRegiones(res.data);
    } catch (err) {
      console.error('❌ Error al cargar regiones:', err);
      toast.error('No se pudieron cargar las regiones');
    }
  };
  
  fetchRegiones();
}, []);



  useEffect(() => {
    if (usuario.region_id) {
      axios
        .get(`http://localhost:3000/api/location/comunas/${usuario.region_id}`)
        .then((res) => setComunas(res.data))
        .catch((err) => console.error('Error al cargar comunas:', err.message));
    }
  }, [usuario.region_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:3000/api/cliente/modificar', usuario);
      toast.success('Datos actualizados correctamente');
      setModificarDatos(false);
    } catch (err) {
      console.error('Error al modificar datos:', err.message);
      toast.error('Error al modificar datos');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Historial de Pedidos */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-2">Historial de Pedidos</h2>
        {historialPedidos.length === 0 ? (
          <p>No tienes pedidos realizados aún.</p>
        ) : (
          <div>
            {historialPedidos.map((pedido, index) => (
              <div key={index} className="border-b py-2">
                <p>Pedido #{pedido.id_pedido} - Total: ${pedido.total}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modificación de Datos */}
      <div className="mt-10">
        <button
          onClick={() => setModificarDatos(!modificarDatos)}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          {modificarDatos ? 'Cancelar' : 'Modificar mis datos'}
        </button>

        {modificarDatos && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <input
                type="text"
                name="nombre"
                value={usuario.nombre}
                onChange={(e) => setUsuario({ ...usuario, nombre: e.target.value })}
                placeholder="Nombre"
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <input
                type="text"
                name="apellido"
                value={usuario.apellido}
                onChange={(e) => setUsuario({ ...usuario, apellido: e.target.value })}
                placeholder="Apellido"
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <input
                type="email"
                name="correo"
                value={usuario.correo}
                onChange={(e) => setUsuario({ ...usuario, correo: e.target.value })}
                placeholder="Correo"
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <input
                type="password"
                name="contrasena"
                value={usuario.contrasena}
                onChange={(e) => setUsuario({ ...usuario, contrasena: e.target.value })}
                placeholder="Nueva Contraseña"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <input
                type="text"
                name="direccion"
                value={usuario.direccion}
                onChange={(e) => setUsuario({ ...usuario, direccion: e.target.value })}
                placeholder="Dirección"
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <input
                type="text"
                name="ciudad"
                value={usuario.ciudad}
                onChange={(e) => setUsuario({ ...usuario, ciudad: e.target.value })}
                placeholder="Ciudad"
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <select
                name="region_id"
                value={usuario.region_id}
                onChange={(e) => setUsuario({ ...usuario, region_id: e.target.value })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Selecciona Región</option>
                {regiones.map((region) => (
                  <option key={region.id_region} value={region.id_region}>
                    {region.nombre_region}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                name="comuna_id"
                value={usuario.comuna_id}
                onChange={(e) => setUsuario({ ...usuario, comuna_id: e.target.value })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Selecciona Comuna</option>
                {comunas.map((comuna) => (
                  <option key={comuna.id_comuna} value={comuna.id_comuna}>
                    {comuna.nombre_comuna}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
              Guardar Cambios
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Cliente;
