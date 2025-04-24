import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardMedia
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import authService from '../../services/authService';

/**
 * Componente para editar productos
 * @param {Object} product - Datos del producto a editar
 * @param {Boolean} open - Estado del diálogo
 * @param {Function} onClose - Función para cerrar el diálogo
 * @param {Function} onSave - Función para guardar los cambios
 * @param {Array} areas - Lista de áreas disponibles
 */
const ProductEditForm = ({ product, open, onClose, onSave, areas = [] }) => {
  const [editingProduct, setEditingProduct] = useState({
    id: product?.id || 0,
    code: product?.code || '',
    description: product?.description || '',
    quantity: product?.quantity || 1,
    area: product?.area || '',
    photos: product?.photos || [],
    created_by: product?.created_by || 0,
    created_at: product?.created_at || new Date().toISOString(),
    company_id: product?.company_id || 1
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewImages, setPreviewImages] = useState(product?.photos?.map(photo => photo.url) || []);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  // Obtener datos del usuario actual para verificar permisos
  const userData = authService.getUserData();
  const isOperator = userData?.role === 'operador';

  // Actualizar el estado cuando cambia el producto
  React.useEffect(() => {
    if (product) {
      setEditingProduct({
        id: product.id || 0,
        code: product.code || '',
        description: product.description || '',
        quantity: product.quantity || 1,
        area: product.area || '',
        photos: product.photos || [],
        created_by: product.created_by || 0,
        created_at: product.created_at || new Date().toISOString(),
        company_id: product.company_id || 1
      });
      setPreviewImages(product.photos?.map(photo => photo.url) || []);
    }
  }, [product]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct(prev => ({
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
        // Agregar la imagen a las fotos del producto
        setEditingProduct(prev => ({
          ...prev,
          photos: [...prev.photos, {
            id: Date.now() + Math.random(), // ID temporal
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
      setEditingProduct(prev => ({
        ...prev,
        photos: [...prev.photos, {
          id: Date.now() + Math.random(), // ID temporal
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
    setEditingProduct(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    // Validación básica
    if (!editingProduct.code.trim() || editingProduct.quantity <= 0) {
      setError('Por favor complete todos los campos obligatorios correctamente');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Llamar a la función de guardar proporcionada por el componente padre
      await onSave(editingProduct);
      onClose(); // Cerrar el diálogo después de guardar
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      setError('Error al guardar los cambios. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="edit-product-dialog-title"
    >
      <DialogTitle id="edit-product-dialog-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Editar Producto</Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {isOperator && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Como operador, puede modificar la descripción y la cantidad del producto.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Información básica del producto */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Información del Producto
            </Typography>
            <TextField
              name="code"
              label="Código *"
              value={editingProduct.code}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              variant="outlined"
              required
              disabled={isOperator} // Los operadores no pueden cambiar el código
            />
            <TextField
              name="description"
              label="Descripción"
              value={editingProduct.description}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
            />
            <TextField
              name="quantity"
              label="Cantidad *"
              type="number"
              value={editingProduct.quantity}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              variant="outlined"
              required
              InputProps={{
                inputProps: { min: 1 }
              }}
            />
            <FormControl fullWidth margin="normal" variant="outlined" required>
              <InputLabel id="area-select-label">Área *</InputLabel>
              <Select
                labelId="area-select-label"
                name="area"
                value={editingProduct.area}
                onChange={handleInputChange}
                label="Área *"
                disabled={isOperator} // Los operadores no pueden cambiar el área
              >
                {areas.map((area) => (
                  <MenuItem key={area} value={area}>{area}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Gestión de fotos */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Fotos del Producto
            </Typography>
            {!isOperator && (
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => fileInputRef.current.click()}
                >
                  Seleccionar Fotos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => cameraInputRef.current.click()}
                >
                  Tomar Foto
                </Button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleCameraCapture}
                />
              </Box>
            )}

            {/* Previsualización de imágenes */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {previewImages.map((image, index) => (
                <Card key={index} sx={{ width: 120, position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="100"
                    image={image}
                    alt={`Foto ${index + 1}`}
                    sx={{ objectFit: 'cover' }}
                  />
                  {!isOperator && (
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bgcolor: 'rgba(255,255,255,0.7)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                      }}
                      onClick={() => handleRemoveImage(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Card>
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={loading}
        >
          Guardar Cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductEditForm;