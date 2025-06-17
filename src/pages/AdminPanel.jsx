import React from 'react';
import { Link } from 'react-router-dom';
import '../Styles/AdminPanel.css'; // Asegúrate de tener este archivo CSS

const AdminPanel = () => {
  return (
    <div className="admin-panel-container">
      <h2 className="admin-panel-title">Panel de Control de Administración</h2>
      <nav className="admin-nav">
        <ul className="admin-nav-list">
          <li className="admin-nav-item">
            <Link to="/admin/Reportes" className="admin-nav-link">
              <span className="nav-icon">📊</span>
              Generar Reportes
            </Link>
          </li>
          <li className="admin-nav-item">
            <Link to="/admin/ListarProductos" className="admin-nav-link">
              <span className="nav-icon">📦</span>
              Listar Productos
            </Link>
          </li>
          <li className="admin-nav-item">
            <Link to="/admin/AgregarProducto" className="admin-nav-link">
              <span className="nav-icon">➕</span>
              Agregar Producto
            </Link>
          </li>
          <li className="admin-nav-item">
            <Link to="/admin/AdminUsuarios" className="admin-nav-link">
              <span className="nav-icon">👥</span>
              Listar Usuarios
            </Link>
          </li>
          <li className="admin-nav-item">
            <Link to="/admin/GestionarPedidos" className="admin-nav-link">
              <span className="nav-icon">🛒</span>
              Gestionar Pedidos
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default AdminPanel;