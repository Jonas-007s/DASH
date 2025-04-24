import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import theme from './theme';

// Componentes
import Layout from './components/Layout/Layout';
import LoginForm from './components/Auth/LoginForm';

// Vistas
import Dashboard from './views/Dashboard';
import OrdersView from './views/Orders/OrdersView';
import OrderDetail from './views/Orders/OrderDetail';
import OrderCreate from './views/Orders/OrderCreate';
import ProductRegistration from './views/Products/ProductRegistration';
import ProductList from './views/Products/ProductList';
import UserManagement from './views/UserManagement';
import ProfileView from './views/ProfileView';

// Servicios
import authService from './services/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = authService.getToken();
      const userData = authService.getUserData();
      if (token && userData) {
        setIsAuthenticated(true);
        setCurrentUser(userData);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const userData = await authService.login(credentials);
      setIsAuthenticated(true);
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      console.error('Error de autenticación:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (loading) {
    return <div className="flex-center" style={{ height: '100vh' }}>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="auth-container">
          <LoginForm onLogin={handleLogin} />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <BrowserRouter>
          <Layout user={currentUser} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<OrdersView />} />
              <Route path="/orders/new" element={<OrderCreate />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/register" element={<ProductRegistration />} />
              <Route path="/users" element={<UserManagement companyId={currentUser?.companyId} />} />
              <Route path="/profile" element={<ProfileView user={currentUser} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;