import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api', // asegúrate de usar tu puerto correcto
  withCredentials: true, // si usas cookies/sesiones
});

export default api;
