import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  IconButton
} from '@mui/material';

// Iconos
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

// Servicios
import dbService from '../../services/dbService';
import authService from '../../services/authService';
import { PRIORITY_LEVELS } from '../../utils/mockData';

const OrderCreate = () => {
  const navigate = useNavigate();
  const userData = authService.getUserData();
  
  const [order, setOrder] = useState({
    title: '',
    description: '',
    priority: 'medium',
    location: '',
    company_id: userData?.companyId || 1,
    created_at: new Date().toISOString(),
    status: 'pending',
    client_id: userData?.role === 'client' ? userData.id : null,
    photos: [],
    comments: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // const [technicians, setTechnicians] = useState([]); // Eliminado estado de técnicos

  // Eliminado useEffect para cargar técnicos

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrder(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!order.title.trim() || !order.description.trim() || !order.location.trim()) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Crear la orden en la base de datos
      const newOrder = await dbService.insert('orders', order);
      
      setSuccess(true);
      
      // Redireccionar después de un breve retraso
      setTimeout(() => {
        navigate(`/orders/${newOrder.id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error al crear la orden:', err);
      setError('Error al crear la orden. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/orders');
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">Crear Nueva Orden</Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Orden creada exitosamente. Redirigiendo...
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Título"
                fullWidth
                required
                value={order.title}
                onChange={handleChange}
                disabled={loading || success}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Descripción"
                fullWidth
                required
                multiline
                rows={4}
                value={order.description}
                onChange={handleChange}
                disabled={loading || success}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="location"
                label="Ubicación"
                fullWidth
                required
                value={order.location}
                onChange={handleChange}
                disabled={loading || success}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  name="priority"
                  value={order.priority}
                  label="Prioridad"
                  onChange={handleChange}
                  disabled={loading || success}
                >
                  <MenuItem value={PRIORITY_LEVELS.LOW} sx={{ color: 'white', bgcolor: '#1b5e20', fontWeight: 'bold' }}>Baja</MenuItem>
                  <MenuItem value={PRIORITY_LEVELS.MEDIUM} sx={{ color: 'black', bgcolor: '#FFD700', fontWeight: 'bold' }}>Media</MenuItem>
                  <MenuItem value={PRIORITY_LEVELS.HIGH} sx={{ color: 'white', bgcolor: '#8d6e63', fontWeight: 'bold' }}>Alta</MenuItem>
                  <MenuItem value={PRIORITY_LEVELS.URGENT} sx={{ color: 'white', bgcolor: '#d32f2f', fontWeight: 'bold' }}>Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Campo Asignar a Técnico eliminado */}
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={loading || success}
                sx={{ mr: 2 }}
              >
                {loading ? 'Guardando...' : 'Guardar Orden'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={loading || success}
              >
                Cancelar
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default OrderCreate;