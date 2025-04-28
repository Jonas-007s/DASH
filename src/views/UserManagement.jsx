import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  useTheme, // Importar useTheme
  useMediaQuery // Importar useMediaQuery
} from '@mui/material';

// Iconos
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

// Servicios
import dbService from '../services/dbService';
import authService from '../services/authService';

const UserManagement = ({ companyId }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el diálogo de usuario
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' o 'edit'
  const [currentUser, setCurrentUser] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    // area: '', // Eliminado
    // location: '', // Eliminado
    company_id: companyId
  });
  
  // Estado para confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const theme = useTheme(); // Obtener el tema
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Verificar si es móvil

  // Verificar permisos
  const hasManageUsersPermission = authService.hasPermission('manage_users');

  // Cargar usuarios
  useEffect(() => {
    const loadUsers = async () => {
      if (!hasManageUsersPermission) {
        setError('No tienes permisos para gestionar usuarios');
        setLoading(false);
        return;
      }
      
      try {
        // Filtrar usuarios por compañía
        const usersData = await dbService.find('users', { company_id: companyId });
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        setError('Error al cargar la lista de usuarios');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [companyId, hasManageUsersPermission]);

  // Filtrar usuarios cuando cambia el término de búsqueda
  useEffect(() => {
    let filtered = [...users];

    // Aplicar filtro inicial por rol 'operador' si no hay término de búsqueda
    if (searchTerm.trim() === '') {
      filtered = users.filter(user => 
        user.role && user.role.toLowerCase() === 'operador'
      );
    } else {
      // Filtrar por término de búsqueda si existe
      const term = searchTerm.toLowerCase();
      filtered = users.filter(user => 
        (user.name && user.name.toLowerCase().includes(term)) || 
        (user.email && user.email.toLowerCase().includes(term))
        // (user.area && user.area.toLowerCase().includes(term)) || // Eliminado
        // (user.location && user.location.toLowerCase().includes(term)) // Eliminado
      );
    }
    
    setFilteredUsers(filtered);
    setPage(0); // Reset page to 0 whenever filters change
  }, [searchTerm, users]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Funciones para el diálogo de usuario
  const handleOpenAddDialog = () => {
    setCurrentUser({
      name: '',
      email: '',
      password: '',
      role: '',
      area: '',
      location: '',
      company_id: companyId
    });
    setDialogMode('add');
    setUserDialogOpen(true);
  };

  const handleOpenEditDialog = (user) => {
    setCurrentUser({
      ...user,
      password: '' // No mostrar la contraseña actual por seguridad
    });
    setDialogMode('edit');
    setUserDialogOpen(true);
  };

  const handleCloseUserDialog = () => {
    setUserDialogOpen(false);
  };

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      
      // Validar campos requeridos
      if (!currentUser.name || !currentUser.email || !currentUser.role) {
        setError('Por favor complete los campos requeridos');
        setLoading(false);
        return;
      }
      
      // Si es un nuevo usuario, la contraseña es obligatoria
      if (dialogMode === 'add' && !currentUser.password) {
        setError('La contraseña es obligatoria para nuevos usuarios');
        setLoading(false);
        return;
      }
      
      let updatedUser;
      
      let userDataToSave = { ...currentUser };
      // Eliminar area y location antes de guardar
      delete userDataToSave.area;
      delete userDataToSave.location;

      if (dialogMode === 'add') {
        // Crear nuevo usuario
        updatedUser = await dbService.insert('users', userDataToSave);
        setUsers(prev => [...prev, updatedUser]);
      } else {
        // Actualizar usuario existente
        const userToUpdate = { ...userDataToSave };

        // Si no se cambió la contraseña, no enviarla en la actualización
        if (!userToUpdate.password) {
          delete userToUpdate.password;
        }

        updatedUser = await dbService.update('users', currentUser.id, userToUpdate);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      }
      
      setUserDialogOpen(false);
      setError('');
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      setError(`Error al ${dialogMode === 'add' ? 'crear' : 'actualizar'} usuario`);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para eliminar usuario
  const handleOpenDeleteDialog = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      await dbService.delete('users', userToDelete.id);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setError('Error al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar chip de rol
  const renderRoleChip = (role) => {
    const roleConfig = {
      admin: { label: 'Administrador', color: 'error' },
      supervisor: { label: 'Supervisor', color: 'warning' },
      operador: { label: 'Operador', color: 'info' },
      client: { label: 'Cliente', color: 'success' }
    };

    const config = roleConfig[role] || { label: role, color: 'default' };

    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        size="small" 
        variant="outlined"
      />
    );
  };

  if (!hasManageUsersPermission) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para acceder a la gestión de usuarios.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 } }}> {/* Ajustar padding responsivo */}
    <Paper sx={{ width: '100%', mb: 2, p: { xs: 1, sm: 2 } }}> {/* Padding responsivo */}
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, gap: 2 }}> {/* Flex direction y gap responsivo */}
          <Typography variant="h6" component="div">
            Gestión de Usuarios
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            size={isMobile ? 'small' : 'medium'} // Tamaño responsivo
          >
            Nuevo Usuario
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar usuarios..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size={isMobile ? 'small' : 'medium'} // Tamaño responsivo
          sx={{ mb: 2 }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
             <Table sx={{ minWidth: { xs: 400, sm: 650 } }} aria-label="tabla de usuarios"> {/* minWidth responsivo */}
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rol</TableCell>
                    {/* <TableCell>Área</TableCell> */}
                    {/* <TableCell>Ubicación</TableCell> */}
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell component="th" scope="row">
                          {user.id}
                        </TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{renderRoleChip(user.role)}</TableCell>
                        {/* <TableCell>{user.area}</TableCell> */}
                        {/* <TableCell>{user.location}</TableCell> */}
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditDialog(user)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDeleteDialog(user)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center"> {/* Ajustado colSpan */} 
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              sx={{ 
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  fontWeight: 500,
                  color: 'text.secondary',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' } // Tamaño de fuente responsivo
                },
                '.MuiTablePagination-select': {
                  borderRadius: 1
                },
                '.MuiTablePagination-actions': {
                  ml: { xs: 1, sm: 2 } // Margen responsivo
                },
                '.MuiTablePagination-toolbar': {
                  flexWrap: 'wrap', // Permitir que los elementos se envuelvan en pantallas pequeñas
                  justifyContent: 'center' // Centrar en pantallas pequeñas
                }
              }}
            />
          </>
        )}
      </Paper>

      {/* Diálogo para agregar/editar usuario */}
     <Dialog open={userDialogOpen} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth={!isMobile} fullScreen={isMobile}> {/* Fullscreen en móvil */}
        <DialogTitle>
          {dialogMode === 'add' ? 'Nuevo Usuario' : 'Editar Usuario'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                name="name"
                value={currentUser.name}
                onChange={handleUserInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={currentUser.email}
                onChange={handleUserInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contraseña"
                name="password"
                type="password"
                value={currentUser.password}
                onChange={handleUserInputChange}
                required={dialogMode === 'add'}
                helperText={dialogMode === 'edit' ? 'Dejar en blanco para mantener la contraseña actual' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Rol</InputLabel>
                <Select
                  name="role"
                  value={currentUser.role}
                  onChange={handleUserInputChange}
                  label="Rol"
                >
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="supervisor">Supervisor</MenuItem>
                  <MenuItem value="operador">Operador</MenuItem>
                  <MenuItem value="client">Cliente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Grid item para Área eliminado */}
            {/* Grid item para Ubicación eliminado */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDialog}>Cancelar</Button>
          <Button onClick={handleSaveUser} color="primary">
            {dialogMode === 'add' ? 'Crear' : 'Actualizar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
     <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth={!isMobile} fullScreen={isMobile}> {/* Fullscreen en móvil */}
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar al usuario {userToDelete?.name}?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDeleteUser} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;