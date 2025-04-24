import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip,
  Button,
  TextField,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';

// Iconos
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CommentIcon from '@mui/icons-material/Comment';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';

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
      variant="outlined"
    />
  );
};

// Componentes de prioridad de orden
const PriorityChip = ({ priority }) => {
  const priorityConfig = {
    low: { label: 'Baja', color: 'success' },
    medium: { label: 'Media', color: 'info' },
    high: { label: 'Alta', color: 'error' }
  };

  const config = priorityConfig[priority] || { label: priority, color: 'default' };

  return (
    <Chip 
      label={config.label} 
      color={config.color}
    />
  );
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [users, setUsers] = useState([]);

  const userData = authService.getUserData();
  const userRole = userData?.role || '';
  const userId = userData?.id || 0;

  // Permisos
  const canEditOrder = authService.hasPermission('edit_order');
  const canUpdateStatus = authService.hasPermission('update_order_status');
  const canAddComment = authService.hasPermission('add_order_comment');

  // Cargar orden
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Convertir id a número si viene como string
        const orderId = parseInt(id, 10);
        
        // Buscar la orden
        const orderData = await dbService.findOne('orders', { id: orderId });
        
        if (!orderData) {
          setError('Orden no encontrada');
          return;
        }
        
        // Verificar permisos para ver esta orden
        if (userRole === 'client' && orderData.client_id !== userId) {
          setError('No tienes permiso para ver esta orden');
          return;
        }
        
        if (userRole === 'operador' && orderData.assigned_to !== userId) {
          setError('No tienes permiso para ver esta orden');
          return;
        }
        
        setOrder(orderData);
        setEditedOrder(orderData);
        setNewStatus(orderData.status);
        
        // Cargar usuarios para asignación
        if (userRole === 'admin' || userRole === 'supervisor') {
          const usersData = await dbService.find('users', { role: 'operador' });
          setUsers(usersData);
        }
      } catch (err) {
        console.error('Error al cargar la orden:', err);
        setError('Error al cargar los datos de la orden');
      } finally {
        setLoading(false);
      }
    };
    
    loadOrder();
  }, [id, userRole, userId]);

  const handleBack = () => {
    navigate('/orders');
  };

  const handleEditToggle = () => {
    if (editing) {
      // Cancelar edición
      setEditedOrder(order);
    }
    setEditing(!editing);
  };

  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    setEditedOrder(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveOrder = async () => {
    try {
      setLoading(true);
      // Actualizar la orden en la base de datos
      const updatedOrder = await dbService.update('orders', order.id, editedOrder);
      setOrder(updatedOrder);
      setEditing(false);
    } catch (err) {
      console.error('Error al guardar la orden:', err);
      setError('Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusDialogOpen = () => {
    setStatusDialogOpen(true);
  };

  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
  };

  const handleStatusChange = (e) => {
    setNewStatus(e.target.value);
  };

  const handleStatusUpdate = async () => {
    try {
      setLoading(true);
      // Actualizar el estado de la orden
      const updatedOrder = await dbService.update('orders', order.id, { status: newStatus });
      
      // Agregar comentario automático
      const comment = {
        id: order.comments.length + 1,
        user_id: userId,
        text: `Estado actualizado a: ${newStatus}`,
        timestamp: new Date().toISOString()
      };
      
      updatedOrder.comments.push(comment);
      await dbService.update('orders', order.id, { comments: updatedOrder.comments });
      
      setOrder(updatedOrder);
      setStatusDialogOpen(false);
    } catch (err) {
      console.error('Error al actualizar el estado:', err);
      setError('Error al actualizar el estado');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentDialogOpen = () => {
    setCommentDialogOpen(true);
  };

  const handleCommentDialogClose = () => {
    setCommentDialogOpen(false);
    setNewComment('');
  };

  const handleCommentChange = (e) => {
    setNewComment(e.target.value);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setLoading(true);
      
      // Crear nuevo comentario
      const comment = {
        id: order.comments.length + 1,
        user_id: userId,
        text: newComment.trim(),
        timestamp: new Date().toISOString()
      };
      
      // Actualizar comentarios de la orden
      const updatedComments = [...order.comments, comment];
      const updatedOrder = await dbService.update('orders', order.id, { comments: updatedComments });
      
      setOrder(updatedOrder);
      setCommentDialogOpen(false);
      setNewComment('');
    } catch (err) {
      console.error('Error al agregar comentario:', err);
      setError('Error al agregar el comentario');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Volver a Órdenes
        </Button>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Orden no encontrada</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Volver a Órdenes
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h5" component="h1">
          Orden #{order.id}: {order.title}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Detalles principales */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Detalles de la Orden</Typography>
              {canEditOrder && (
                <IconButton color={editing ? 'error' : 'primary'} onClick={handleEditToggle}>
                  {editing ? <CancelIcon /> : <EditIcon />}
                </IconButton>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />

            {editing ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Título"
                    name="title"
                    value={editedOrder.title}
                    onChange={handleOrderChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    name="description"
                    value={editedOrder.description}
                    onChange={handleOrderChange}
                    multiline
                    rows={4}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Prioridad</InputLabel>
                    <Select
                      name="priority"
                      value={editedOrder.priority}
                      onChange={handleOrderChange}
                      label="Prioridad"
                    >
                      <MenuItem value="low">Baja</MenuItem>
                      <MenuItem value="medium">Media</MenuItem>
                      <MenuItem value="high">Alta</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ubicación"
                    name="location"
                    value={editedOrder.location}
                    onChange={handleOrderChange}
                  />
                </Grid>
                {(userRole === 'admin' || userRole === 'supervisor') && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Técnico Asignado</InputLabel>
                      <Select
                        name="assigned_to"
                        value={editedOrder.assigned_to || ''}
                        onChange={handleOrderChange}
                        label="Técnico Asignado"
                      >
                        <MenuItem value="">Sin asignar</MenuItem>
                        {users.map(user => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveOrder}
                  >
                    Guardar Cambios
                  </Button>
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Descripción:</Typography>
                  <Typography paragraph>{order.description}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Estado:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <OrderStatusChip status={order.status} />
                    {canUpdateStatus && (
                      <Button
                        size="small"
                        onClick={handleStatusDialogOpen}
                        sx={{ ml: 1 }}
                      >
                        Cambiar
                      </Button>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Prioridad:</Typography>
                  <Box sx={{ mt: 1 }}>
                    <PriorityChip priority={order.priority} />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Ubicación:</Typography>
                  <Typography>{order.location}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Fecha de Creación:</Typography>
                  <Typography>
                    {new Date(order.created_at).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Técnico Asignado:</Typography>
                  <Typography>
                    {order.assigned_to ? 'Técnico #' + order.assigned_to : 'Sin asignar'}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Información lateral */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Acciones" />
            <Divider />
            <CardContent>
              <Grid container spacing={1}>
                {canUpdateStatus && (
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleStatusDialogOpen}
                    >
                      Actualizar Estado
                    </Button>
                  </Grid>
                )}
                {canAddComment && (
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CommentIcon />}
                      onClick={handleCommentDialogOpen}
                    >
                      Agregar Comentario
                    </Button>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Comentarios */}
          <Card>
            <CardHeader 
              title="Comentarios" 
              action={
                canAddComment && (
                  <IconButton onClick={handleCommentDialogOpen}>
                    <CommentIcon />
                  </IconButton>
                )
              }
            />
            <Divider />
            <CardContent sx={{ maxHeight: 400, overflow: 'auto' }}>
              {order.comments && order.comments.length > 0 ? (
                <List>
                  {order.comments.map((comment) => (
                    <ListItem key={comment.id} alignItems="flex-start" divider>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={comment.text}
                        secondary={
                          <React.Fragment>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              Usuario #{comment.user_id}
                            </Typography>
                            {" — "}
                            {new Date(comment.timestamp).toLocaleString()}
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  No hay comentarios aún
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diálogo para cambiar estado */}
      <Dialog open={statusDialogOpen} onClose={handleStatusDialogClose}>
        <DialogTitle>Actualizar Estado</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Nuevo Estado</InputLabel>
            <Select
              value={newStatus}
              onChange={handleStatusChange}
              label="Nuevo Estado"
            >
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="in_progress">En Progreso</MenuItem>
              <MenuItem value="completed">Completada</MenuItem>
              <MenuItem value="cancelled">Cancelada</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose}>Cancelar</Button>
          <Button onClick={handleStatusUpdate} color="primary">
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar comentario */}
      <Dialog open={commentDialogOpen} onClose={handleCommentDialogClose}>
        <DialogTitle>Agregar Comentario</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comentario"
            fullWidth
            multiline
            rows={4}
            value={newComment}
            onChange={handleCommentChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCommentDialogClose}>Cancelar</Button>
          <Button 
            onClick={handleAddComment} 
            color="primary"
            endIcon={<SendIcon />}
            disabled={!newComment.trim()}
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetail;