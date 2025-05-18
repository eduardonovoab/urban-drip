import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return <p>No has iniciado sesión.</p>;

  return (
    <div>
      <h2>Perfil de Usuario</h2>
      <p>Nombre: {user.name}</p>
      <p>Rol: {user.role}</p>
    </div>
  );
};

export default Profile;
