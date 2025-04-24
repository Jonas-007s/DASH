import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AUTH_CONFIG from '../../config/auth';
import db from '../../utils/db';
import { toast } from 'react-hot-toast';

const UserManagement = ({ companyId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    area: '',
    location: '',
    password: '',
  });
  
  // Cargar usuarios al iniciar el componente
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await db.findAll('users', { company_id: companyId });
        setUsers(usersData.map(user => ({
          ...user,
          lastActivity: user.updated_at || new Date().toLocaleString(),
        })));
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        toast.error('Error al cargar la lista de usuarios');
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [companyId]);

  const areas = ['Outbound', 'Inbound', 'Quality', 'Packing', 'WoodShop', 'Deviation'];
  const locations = ['Sede Principal', 'Almacén Norte', 'Almacén Sur', 'Centro de Distribución'];

  const handleAddUser = () => {
    setEditMode(false);
    setSelectedUserId(null);
    setFormErrors({});
    setNewUser({
      name: '',
      email: '',
      role: '',
      area: '',
      location: '',
      password: '',
    });
    setOpenDialog(true);
  };

  const handleEditUser = (user) => {
    setEditMode(true);
    setSelectedUserId(user.id);
    setFormErrors({});
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      area: user.area,
      location: user.location,
      password: '', // No mostramos la contraseña actual por seguridad
    });
    setOpenDialog(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Está seguro que desea eliminar este usuario?')) {
      try {
        await db.delete('users', userId);
        setUsers(users.filter(user => user.id !== userId));
        showNotification('Usuario eliminado correctamente', 'success');
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        showNotification('Error al eliminar usuario', 'error');
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedUserId(null);
    setFormErrors({});
    setNewUser({
      name: '',
      email: '',
      role: '',
      area: '',
      location: '',
      password: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpiar error del campo cuando el usuario escribe
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!newUser.name.trim()) errors.name = 'El nombre es requerido';
    if (!newUser.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = 'Email inválido';
    }
    
    if (!editMode && !newUser.password.trim()) {
      errors.password = 'La contraseña es requerida';
    } else if (!editMode && newUser.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (!newUser.role) errors.role = 'El rol es requerido';
    if (!newUser.area) errors.area = 'El área es requerida';
    if (!newUser.location) errors.location = 'La ubicación es requerida';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (editMode) {
        // Actualizar usuario existente
        const userData = {
          ...newUser,
          updated_at: new Date().toLocaleString(),
        };
        
        // Si no se cambió la contraseña, no la incluimos en la actualización
        if (!userData.password) {
          delete userData.password;
        }
        
        const updatedUser = await db.update('users', selectedUserId, userData);
        
        setUsers(users.map(user => 
          user.id === selectedUserId ? {
            ...updatedUser,
            lastActivity: updatedUser.updated_at,
          } : user
        ));
        
        showNotification('Usuario actualizado correctamente', 'success');
      } else {
        // Crear nuevo usuario
        const userData = {
          ...newUser,
          id: Date.now(), // Generar ID único
          company_id: companyId,
          created_at: new Date().toLocaleString(),
          updated_at: new Date().toLocaleString(),
        };
        
        const newUserData = await db.create('users', userData);
        
        setUsers([...users, {
          ...newUserData,
          lastActivity: newUserData.created_at,
        }]);
        
        showNotification('Usuario creado correctamente', 'success');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      showNotification('Error al guardar usuario', 'error');
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      toast.success('Imagen subida exitosamente');
      setNewUser((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Box>
      <Box>
        <Snackbar 
          open={notification.open} 
          autoHideDuration={6000} 
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Gestión de Usuarios</Typography>
              <Button variant="contained" onClick={handleAddUser}>
                Agregar Usuario
              </Button>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <Typography>Cargando usuarios...</Typography>
              </Box>
            ) : users.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <Typography>No hay usuarios registrados</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell>Área</TableCell>
                      <TableCell>Ubicación</TableCell>
                      <TableCell>Última Actividad</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {AUTH_CONFIG.roles[user.role]?.name || user.role}
                        </TableCell>
                        <TableCell>{user.area}</TableCell>
                        <TableCell>{user.location}</TableCell>
                        <TableCell>{user.lastActivity}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <IconButton onClick={() => handleEditUser(user)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton onClick={() => handleDeleteUser(user.id)} size="small" color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editMode ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Nombre"
              name="name"
              value={newUser.name}
              onChange={handleChange}
              margin="normal"
              required
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={newUser.email}
              onChange={handleChange}
              margin="normal"
              required
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <TextField
              fullWidth
              label={editMode ? 'Nueva Contraseña (dejar en blanco para mantener la actual)' : 'Contraseña'}
              name="password"
              type="password"
              value={newUser.password}
              onChange={handleChange}
              margin="normal"
              required={!editMode}
              error={!!formErrors.password}
              helperText={formErrors.password}
            />
            <FormControl fullWidth margin="normal" required error={!!formErrors.role}>
              <InputLabel>Rol</InputLabel>
              <Select
                name="role"
                value={newUser.role}
                onChange={handleChange}
                label="Rol"
              >
                {Object.entries(AUTH_CONFIG.roles).map(([key, role]) => (
                  <MenuItem key={key} value={key}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.role && <Typography color="error" variant="caption">{formErrors.role}</Typography>}
            </FormControl>
            <FormControl fullWidth margin="normal" required error={!!formErrors.area}>
              <InputLabel>Área</InputLabel>
              <Select
                name="area"
                value={newUser.area}
                onChange={handleChange}
                label="Área"
              >
                {areas.map((area) => (
                  <MenuItem key={area} value={area}>
                    {area}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.area && <Typography color="error" variant="caption">{formErrors.area}</Typography>}
            </FormControl>
            <FormControl fullWidth margin="normal" required error={!!formErrors.location}>
              <InputLabel>Ubicación</InputLabel>
              <Select
                name="location"
                value={newUser.location}
                onChange={handleChange}
                label="Ubicación"
              >
                {locations.map((location) => (
                  <MenuItem key={location} value={location}>
                    {location}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.location && <Typography color="error" variant="caption">{formErrors.location}</Typography>}
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {editMode ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <Box>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </Box>
    </Box>
  );
};

export default UserManagement;