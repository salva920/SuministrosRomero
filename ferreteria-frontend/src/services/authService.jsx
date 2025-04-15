export const logout = () => {
  // Limpiar almacenamiento de forma síncrona
  localStorage.removeItem('token');
  sessionStorage.removeItem('isLoggedIn');
  
  // Forzar recarga completa sin usar navigate
  window.location.href = '/';
  window.location.reload();
};