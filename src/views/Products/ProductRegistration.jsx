import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  Card,
  CardMedia,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';

// Iconos
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// Servicios
import dbService from '../../services/dbService';
import authService from '../../services/authService';
import notificationService from '../../services/notificationService';

const ProductRegistration = () => {
  const navigate = useNavigate();
  const userData = authService.getUserData();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [product, setProduct] = useState({
    code: '',
    description: '',
    quantity: 1,
    area: userData?.area || '',
    photos: [],
    created_by: userData?.id || 0,
    created_at: new Date().toISOString(),
    company_id: userData?.companyId || 1
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [areas, setAreas] = useState([
    'Outbound',
    'Inbound',
    'Quality',
    'Packing',
    'WoodShop',
    'Deviation'
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Procesar cada archivo
    files.forEach(file => {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        // Agregar la imagen al estado de previsualización
        setPreviewImages(prev => [...prev, imageData]);
        // Agregar la imagen a las fotos del producto (en un caso real, aquí se subiría a un servidor)
        setProduct(prev => ({
          ...prev,
          photos: [...prev.photos, {
            id: Date.now(), // ID temporal
            url: imageData,
            name: file.name
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
    
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = null;
  };

  const handleCameraCapture = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Procesar la foto tomada
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      // Agregar la imagen al estado de previsualización
      setPreviewImages(prev => [...prev, imageData]);
      // Agregar la imagen a las fotos del producto
      setProduct(prev => ({
        ...prev,
        photos: [...prev.photos, {
          id: Date.now(), // ID temporal
          url: imageData,
          name: 'Foto_' + new Date().toISOString()
        }]
      }));
    };
    reader.readAsDataURL(file);
    
    // Limpiar el input para permitir tomar otra foto
    e.target.value = null;
  };

  const handleRemoveImage = (index) => {
    // Eliminar la imagen de la previsualización
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    // Eliminar la imagen de las fotos del producto
    setProduct(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!product.code.trim() || product.quantity <= 0) {
      setError('Por favor complete todos los campos obligatorios correctamente');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Verificar si ya existe una colección de productos, si no, crearla
      const existingProducts = await dbService.find('products');
      if (!existingProducts) {
        // Inicializar la colección de productos si no existe
        dbService.data.products = [];
      }
      
      // Crear el producto en la base de datos
      const newProduct = await dbService.insert('products', product);
      
      // Crear notificación de nuevo producto
      notificationService.createProductCreatedNotification(newProduct);
      
      // Si la cantidad es baja, crear notificación de stock bajo
      if (newProduct.quantity <= 3) {
        notificationService.createLowStockNotification(newProduct);
      }
      
      // La actualización del dashboard será automática gracias a la suscripción
      // implementada en el componente Dashboard
      
      setSuccess(true);
      
      // Limpiar el formulario después de un breve retraso
      setTimeout(() => {
        setProduct({
          code: '',
          description: '',
          quantity: 1,
          area: userData?.area || '',
          photos: [],
          created_by: userData?.id || 0,
          created_at: new Date().toISOString(),
          company_id: userData?.companyId || 1
        });
        setPreviewImages([]);
        setSuccess(false);
        
        // Redirigir al usuario al listado de productos después de registrar
        // Esto permite que al volver al dashboard, se vean los datos actualizados
        navigate('/products');
      }, 2000);
      
    } catch (err) {
      console.error('Error al registrar el producto:', err);
      setError('Error al registrar el producto. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1); // Volver a la página anterior
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">Registro de Productos</Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Producto registrado exitosamente.
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                name="code"
                label="Código del Producto"
                fullWidth
                required
                value={product.code}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="quantity"
                label="Cantidad"
                type="number"
                fullWidth
                required
                InputProps={{
                  inputProps: { min: 1 },
                  startAdornment: <InputAdornment position="start">Uds.</InputAdornment>,
                }}
                value={product.quantity}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Descripción"
                fullWidth
                multiline
                rows={3}
                value={product.description}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Área de Trabajo</InputLabel>
                <Select
                  name="area"
                  value={product.area}
                  label="Área de Trabajo"
                  onChange={handleChange}
                  disabled={loading}
                >
                  {areas.map(area => (
                    <MenuItem key={area} value={area}>
                      {area}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Fotografías del Producto
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => fileInputRef.current.click()}
                  disabled={loading}
                >
                  Seleccionar Imágenes
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => cameraInputRef.current.click()}
                  disabled={loading}
                >
                  Tomar Foto
                </Button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                />
                
                <input
                  type="file"
                  ref={cameraInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                />
              </Box>
              
              <Grid container spacing={2}>
                {previewImages.map((image, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="140"
                        image={image}
                        alt={`Producto ${index + 1}`}
                      />
                      <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleRemoveImage(index)}
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={loading}
                sx={{ mr: 2 }}
              >
                {loading ? 'Guardando...' : 'Registrar Producto'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={loading}
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

export default ProductRegistration;