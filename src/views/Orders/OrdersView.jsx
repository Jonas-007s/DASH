import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';

// Iconos
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';

// Servicios
import dbService from '../../services/dbService';
import authService from '../../services/authService';

// Componentes de estado de orden
const OrderStatusChip = ({ status }) => {
  const statusConfig = {
    pending: { label: 'Pendiente', color: 'warning' },
    in_progress: { label: 'En Progreso', color: 'info' },
    completed: { label: 'Completada', color: 'success' },
    cancelled: { label: 'Cancelada', color: 'error' }
  };

  const config = statusConfig[status] || { label: status, color: 'default' };

  return (
    <Chip 
      label={config.label} 
      color={config.color} 
      size="small" 
      variant="outlined"
    />
  );
};

// Componentes de prioridad de orden
const PriorityChip = ({ priority }) => {
  const priorityConfig = {
    low: { label: 'Baja', color: 'success', bgcolor: '#1b5e20', textColor: 'white' },
    medium: { label: 'Media', color: 'warning', bgcolor: '#FFD700', textColor: 'black' },
    high: { label: 'Alta', color: 'default', bgcolor: '#8d6e63', textColor: 'white' },
    urgent: { label: 'Urgente', color: 'error', bgcolor: '#d32f2f', textColor: 'white' }
  };

  const config = priorityConfig[priority] || { label: priority, color: 'default' };

  return (
    <Chip 
      label={config.label} 
      color={config.color}
      size="small"
      sx={{
        fontWeight: 'bold',
        color: config.textColor,
        bgcolor: config.bgcolor
      }}
    />
  );
};

const OrdersView = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: ''
  });

  const userData = authService.getUserData();
  const userRole = userData?.role || '';
  const userId = userData?.id || 0;

  // Cargar órdenes
  useEffect(() => {
    const loadOrders = async () => {
      try {
        let ordersData;
        
        // Si es cliente, solo ver sus propias órdenes
        if (userRole === 'client') {
          ordersData = await dbService.find('orders', { client_id: userId });
        } else {
          // Para otros roles, cargar todas las órdenes o las asignadas (operador)
          if (userRole === 'operador') {
            ordersData = await dbService.find('orders', { assigned_to: userId });
          } else {
            ordersData = await dbService.find('orders');
          }
        }
        
        setOrders(ordersData);
        setFilteredOrders(ordersData);
      } catch (error) {
        console.error('Error al cargar órdenes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [userRole, userId]);

  // Filtrar órdenes
  useEffect(() => {
    let result = [...orders];
    
    // Aplicar filtro inicial por 'pendiente' si no hay término de búsqueda ni filtros activos
    if (!searchTerm && !filters.status && !filters.priority) {
      result = orders.filter(order => order.status === 'pending');
    } else {
      // Aplicar búsqueda por texto si existe
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(order => 
          (order.title && order.title.toLowerCase().includes(term)) || 
          (order.description && order.description.toLowerCase().includes(term)) ||
          (order.location && order.location.toLowerCase().includes(term))
        );
      }
      
      // Aplicar filtros si existen
      if (filters.status) {
        result = result.filter(order => order.status === filters.status);
      }
      
      if (filters.priority) {
        result = result.filter(order => order.priority === filters.priority);
      }
    }
    
    setFilteredOrders(result);
    setPage(0); // Reset page to 0 whenever filters or search term change
  }, [orders, searchTerm, filters]);

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

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterDialogOpen = () => {
    setFilterDialogOpen(true);
  };

  const handleFilterDialogClose = () => {
    setFilterDialogOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      priority: ''
    });
    setFilterDialogOpen(false);
  };

  const handleViewOrder = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const handleCreateOrder = () => {
    navigate('/orders/new');
  };

  // Verificar si el usuario tiene permiso para crear órdenes
  const canCreateOrder = authService.hasPermission('create_order');

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Órdenes de Trabajo
          </Typography>
          <Box>
            {canCreateOrder && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreateOrder}
                sx={{ ml: 1 }}
              >
                Nueva Orden
              </Button>
            )}
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar órdenes..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={handleFilterDialogOpen}
              size="medium"
            >
              Filtros
              {(filters.status || filters.priority) && (
                <Chip 
                  size="small" 
                  label={Object.values(filters).filter(Boolean).length} 
                  color="primary" 
                  sx={{ ml: 1 }}
                />
              )}
            </Button>
          </Grid>
        </Grid>

        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="tabla de órdenes">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Prioridad</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Fecha Creación</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell component="th" scope="row">
                      {order.id}
                    </TableCell>
                    <TableCell>{order.title}</TableCell>
                    <TableCell>
                      <OrderStatusChip status={order.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityChip priority={order.priority} />
                    </TableCell>
                    <TableCell>{order.location}</TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => handleViewOrder(order.id)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No se encontraron órdenes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Diálogo de filtros */}
      <Dialog open={filterDialogOpen} onClose={handleFilterDialogClose}>
        <DialogTitle>Filtrar Órdenes</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, width: 300 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="status-filter-label">Estado</InputLabel>
              <Select
                labelId="status-filter-label"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pending">Pendiente</MenuItem>
                <MenuItem value="in_progress">En Progreso</MenuItem>
                <MenuItem value="completed">Completada</MenuItem>
                <MenuItem value="cancelled">Cancelada</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel id="priority-filter-label">Prioridad</InputLabel>
              <Select
                labelId="priority-filter-label"
                name="priority"
                value={filters.priority}
                onChange={handleFilterChange}
                label="Prioridad"
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="low">Baja</MenuItem>
                <MenuItem value="medium">Media</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearFilters}>Limpiar</Button>
          <Button onClick={handleFilterDialogClose} color="primary">
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdersView;