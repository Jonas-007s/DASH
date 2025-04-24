import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Card,
  CardMedia,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';

// Componentes personalizados
import ProductEditForm from '../../components/Products/ProductEditForm';

// Componente Modal para detalles del producto
import ProductDetailModal from '../../components/Products/ProductDetailModal';

// Iconos
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Servicios
import dbService from '../../services/dbService';
import authService from '../../services/authService';

const ProductList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialFilterArea = location.state?.filterArea || '';
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState(initialFilterArea);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const userData = authService.getUserData();

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Verificar si existe la colección de productos
        let productsData = await dbService.find('products');
        
        // Si no existe, inicializarla
        if (!productsData || productsData.length === 0) {
          if (!dbService.data.products) {
            dbService.data.products = [];
          }
          productsData = [];
        }
        
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filtrar productos
  useEffect(() => {
    let filtered = [...products];
    const term = searchTerm.toLowerCase().trim();

    if (term) {
      // Filtrar por término de búsqueda (que puede ser el área inicial o lo ingresado por el usuario)
      filtered = products.filter(product => 
        (product.code && product.code.toLowerCase().includes(term)) || 
        (product.description && product.description.toLowerCase().includes(term)) ||
        (product.area && product.area.toLowerCase().includes(term))
      );
    } else {
      // Si no hay término de búsqueda (ni inicial ni ingresado), mostrar todos o aplicar un filtro por defecto si se desea
      // Por ahora, mostramos todos si no hay término
      // Si se quisiera mantener el filtro 'inbound' por defecto cuando no hay búsqueda:
      // filtered = products.filter(product => product.area && product.area.toLowerCase() === 'inbound');
    }
    
    setFilteredProducts(filtered);
    setPage(0); // Reset page to 0 whenever filters change
  }, [products, searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleRegisterProduct = () => {
    navigate('/products/register');
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
  };

  const handleEditProduct = (product) => {
    // Pasar el producto completo al estado para edición
    setEditingProduct(product);
    setEditDialogOpen(true);
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    try {
      setLoading(true);
      const success = await dbService.delete('products', productToDelete.id);
      if (success) {
        // Actualizar la lista de productos después de eliminar
        setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      }
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const saveEditedProduct = async (updatedProductData) => {
    try {
      setLoading(true);
      
      // Actualizar el producto en la base de datos
      const updatedProduct = await dbService.update('products', updatedProductData.id, updatedProductData);
      
      // Actualizar la lista de productos
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      
      // Actualizar también los productos filtrados
      setFilteredProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      
      return updatedProduct;
    } catch (error) {
      console.error('Error al actualizar el producto:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Modal de detalles del producto */}
      <ProductDetailModal 
        open={detailModalOpen} 
        onClose={handleCloseDetailModal} 
        product={selectedProduct} 
      />

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'error.light', color: 'error.contrastText', py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Confirmar eliminación</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <DialogContentText>
            ¿Está seguro que desea eliminar el producto <strong>{productToDelete?.code}</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            color="primary"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmDeleteProduct} 
            color="error" 
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Componente de edición de producto */}
      <ProductEditForm 
        product={editingProduct}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={saveEditedProduct}
        areas={['Outbound', 'Inbound', 'Quality', 'Packing', 'WoodShop', 'Deviation']}
      />
      
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>Productos Registrados</Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleRegisterProduct}
            sx={{ px: 3, py: 1.2, borderRadius: 2, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
          >
            Registrar Producto
          </Button>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Buscar por código, descripción o área..."
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2,
                '&.Mui-focused': {
                  boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)'
                }
              } 
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {loading ? (
          <Typography>Cargando productos...</Typography>
        ) : filteredProducts.length === 0 ? (
          <Typography>No hay productos registrados. Comience registrando uno nuevo.</Typography>
        ) : (
          <>
            <TableContainer sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Cantidad</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Área</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Fotos</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((product) => (
                      <TableRow key={product.id} sx={{ '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.04)' } }}>
                        <TableCell sx={{ fontWeight: 500 }}>{product.code}</TableCell>
                        <TableCell sx={{ color: product.description ? 'red' : 'inherit' }}>{product.description}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{product.quantity}</TableCell>
                        <TableCell>
                          <Chip 
                            label={product.area} 
                            size="small" 
                            sx={{ 
                              fontWeight: 500, 
                              bgcolor: 'primary.light', 
                              color: 'primary.contrastText',
                              px: 1
                            }} 
                          />
                        </TableCell>
                        <TableCell>
                          {product.photos && product.photos.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {product.photos.slice(0, 2).map((photo, index) => (
                                <Card 
                                  key={index} 
                                  sx={{ 
                                    width: 60, 
                                    height: 60, 
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                      transform: 'scale(1.05)',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }
                                  }}
                                >
                                  <CardMedia
                                    component="img"
                                    height="60"
                                    image={photo.url}
                                    alt={`Producto ${product.code}`}
                                    sx={{ objectFit: 'cover' }}
                                  />
                                </Card>
                              ))}
                              {product.photos.length > 2 && (
                                <Chip 
                                  label={`+${product.photos.length - 2}`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ bgcolor: 'rgba(37, 99, 235, 0.1)', borderColor: 'primary.light' }}
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Sin fotos
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleViewProduct(product)}
                              sx={{ 
                                bgcolor: 'rgba(37, 99, 235, 0.1)', 
                                '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.2)' } 
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            {/* Mostrar botón de edición solo si el usuario tiene permiso */}
                            {(authService.hasPermission('edit_product') || userData?.role === 'operador') && (
                              <IconButton 
                                size="small" 
                                color="secondary"
                                onClick={() => handleEditProduct(product)}
                                sx={{ 
                                  bgcolor: 'rgba(236, 72, 153, 0.1)', 
                                  '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.2)' } 
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteProduct(product)}
                              sx={{ 
                                bgcolor: 'rgba(239, 68, 68, 0.1)', 
                                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' } 
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredProducts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              sx={{ 
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  fontWeight: 500,
                  color: 'text.secondary'
                },
                '.MuiTablePagination-select': {
                  borderRadius: 1
                }
              }}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ProductList;