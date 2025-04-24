import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Box,
  IconButton,
  Paper,
  Divider,
  Zoom
} from '@mui/material';
import { Close, ZoomIn, ZoomOut, NavigateBefore, NavigateNext } from '@mui/icons-material';
import Carousel from 'react-material-ui-carousel';

const ProductDetailModal = ({ open, onClose, product }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [zoomedImage, setZoomedImage] = useState(null);
  const maxSteps = product?.photos?.length || 0;

  const handleImageClick = (imageUrl) => {
    setZoomedImage(imageUrl);
  };

  const handleCloseZoom = () => {
    setZoomedImage(null);
  };

  if (!product) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="product-detail-dialog-title"
    >
      <DialogTitle id="product-detail-dialog-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Detalles del Producto: {product.code}</Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* Modal de zoom para imágenes */}
        <Dialog
          open={!!zoomedImage}
          onClose={handleCloseZoom}
          maxWidth="xl"
          fullWidth
        >
          <DialogContent sx={{ p: 0, position: 'relative', bgcolor: 'rgba(0,0,0,0.9)' }}>
            <IconButton
              onClick={handleCloseZoom}
              sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.3)' }}
            >
              <Close />
            </IconButton>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '80vh',
              }}
            >
              <Zoom in={!!zoomedImage}>
                <Box
                  component="img"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    objectFit: 'contain',
                  }}
                  src={zoomedImage}
                  alt="Imagen ampliada"
                />
              </Zoom>
            </Box>
          </DialogContent>
        </Dialog>

        <Grid container spacing={3}>
          {/* Carrusel de fotos */}
          {product.photos && product.photos.length > 0 ? (
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Carousel
                  autoPlay={false}
                  animation="slide"
                  navButtonsAlwaysVisible
                  indicators={product.photos.length > 1}
                  navButtonsProps={{
                    style: {
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: 0,
                    }
                  }}
                  NextIcon={<NavigateNext />}
                  PrevIcon={<NavigateBefore />}
                >
                  {product.photos.map((photo, index) => (
                    <Box
                      key={index}
                      sx={{
                        height: 350,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#f5f5f5',
                        position: 'relative',
                      }}
                    >
                      <Box
                        component="img"
                        sx={{
                          maxHeight: '100%',
                          maxWidth: '100%',
                          objectFit: 'contain',
                          cursor: 'zoom-in',
                        }}
                        src={photo.url}
                        alt={`Foto ${index + 1} del producto ${product.code}`}
                        onClick={() => handleImageClick(photo.url)}
                      />
                      <IconButton
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          bgcolor: 'rgba(255,255,255,0.7)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                        }}
                        onClick={() => handleImageClick(photo.url)}
                      >
                        <ZoomIn />
                      </IconButton>
                    </Box>
                  ))}
                </Carousel>
                <Box sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {product.photos.length} {product.photos.length === 1 ? 'foto' : 'fotos'} disponibles • Haga clic en la imagen para ampliar
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ) : (
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#f5f5f5',
                  borderRadius: 1
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  No hay fotos disponibles para este producto
                </Typography>
              </Box>
            </Grid>
          )}

          {/* Información del producto */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
                Información del Producto
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Código
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {product.code}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Cantidad
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {product.quantity}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Área
                    </Typography>
                    <Chip label={product.area} color="primary" size="small" />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Fecha de Registro
                    </Typography>
                    <Typography variant="body1">
                      {new Date(product.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Descripción
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    bgcolor: '#fafafa'
                  }}
                >
                  <Typography 
                    variant="body1" 
                    component="div" 
                    sx={{ 
                      whiteSpace: 'pre-line',
                      wordBreak: 'break-word'
                    }}
                  >
                    {product.description || 'Sin descripción'}
                  </Typography>
                </Paper>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductDetailModal;