import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Styles/AdminPanel.css'; // Asegúrate de tener este archivo CSS

const AdminPanel = () => {
  return (
    <div className="admin-panel-container">
      <h2 className="admin-panel-title">Panel de Control de Administración</h2>
      <nav className="admin-nav">
        <ul className="admin-nav-list">
          <li className="admin-nav-item">
            <Link to="/admin/Reportes" className="admin-nav-link">Generar Reportes</Link>
          </li>
          <li className="admin-nav-item">
            <Link to="/admin/ListarProductos" className="admin-nav-link">Listar Productos</Link>
          </li>
          <li className="admin-nav-item">
            <Link to="/admin/AgregarProducto" className="admin-nav-link">Agregar Producto</Link>
          </li>
          <li className="admin-nav-item">
            <Link to="/admin/AdminUsuarios" className="admin-nav-link">Listar Usuarios</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default AdminPanel;
