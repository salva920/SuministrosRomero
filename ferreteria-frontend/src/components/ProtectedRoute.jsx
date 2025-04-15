import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem('token') && sessionStorage.getItem('isLoggedIn');
  
  // Si está autenticado, permitir el acceso a las rutas protegidas; de lo contrario, redirigir a /
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;