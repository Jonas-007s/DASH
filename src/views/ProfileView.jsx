import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';

// Iconos
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import SaveIcon from '@mui/icons-material/Save';
import SecurityIcon from '@mui/icons-material/Security';

// Servicios
import authService from '../services/authService';
import dbService from '../services/dbService';

const ProfileView = ({ user }) => {
  const [editing, setEditing] = useState(false);
  const [userData, setUserData] = useState(user);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    area: user?.area || '',
    location: user?.location || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleEditToggle = () => {
    if (editing) {
      // Cancelar edición
      setFormData({
        name: userData?.name || '',
        email: userData?.email || '',
        area: userData?.area || '',
        location: userData?.location || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
    setEditing(!editing);
    setChangingPassword(false);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordToggle = () => {
    setChangingPassword(!changingPassword);
    if (!changingPassword) {
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validar campos
      if (!formData.name || !formData.email) {
        setError('Por favor complete los campos requeridos');
        setLoading(false);
        return;
      }

      // Validar contraseñas si está cambiando la contraseña
      if (changingPassword) {
        if (!formData.currentPassword) {
          setError('Debe ingresar su contraseña actual');
          setLoading(false);
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          setError('Las contraseñas nuevas no coinciden');
          setLoading(false);
          return;
        }

        if (formData.newPassword.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }

        // Verificar contraseña actual
        const currentUser = await dbService.findOne('users', { id: userData.id });
        if (currentUser.password !== formData.currentPassword) {
          setError('La contraseña actual es incorrecta');
          setLoading(false);
          return;
        }
      }

      // Preparar datos para actualizar
      const updateData = {
        name: formData.name,
        email: formData.email,
        area: formData.area,
        location: formData.location
      };

      // Agregar nueva contraseña si está cambiando
      if (changingPassword && formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      // Actualizar en la base de datos
      const updatedUser = await dbService.update('users', userData.id, updateData);

      // Actualizar datos de usuario en localStorage
      const updatedUserData = {
        ...userData,
        name: updatedUser.name,
        email: updatedUser.email,
        area: updatedUser.area,
        location: updatedUser.location
      };

      authService.setUserData(updatedUserData);
      setUserData(updatedUserData);

      setSuccess('Perfil actualizado correctamente');
      setEditing(false);
      setChangingPassword(false);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setError('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Obtener el nombre del rol
  const getRoleName = (roleKey) => {
    const roles = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      operador: 'Operador',
      client: 'Cliente'
    };
    return roles[roleKey] || roleKey;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <Avatar
                sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}
              >
                {userData?.name?.charAt(0) || 'U'}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {userData?.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {getRoleName(userData?.role)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userData?.email}
              </Typography>
              
              <Button
                variant="outlined"
                color={editing ? 'error' : 'primary'}
                sx={{ mt: 3 }}
                onClick={handleEditToggle}
              >
                {editing ? 'Cancelar' : 'Editar Perfil'}
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardHeader title="Información" />
            <Divider />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={userData?.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WorkIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Área"
                    secondary={userData?.area || 'No especificada'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocationOnIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Ubicación"
                    secondary={userData?.location || 'No especificada'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <BusinessIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Empresa"
                    secondary={`ID: ${userData?.companyId || 'No asignada'}`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {editing ? (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Editar Perfil
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Área"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ubicación"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Button
                      variant="text"
                      color="primary"
                      startIcon={<SecurityIcon />}
                      onClick={handlePasswordToggle}
                    >
                      {changingPassword ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
                    </Button>
                  </Box>
                </Grid>

                {changingPassword && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Contraseña Actual"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nueva Contraseña"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Confirmar Nueva Contraseña"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          ) : (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Información del Perfil
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Nombre
                    </Typography>
                    <Typography variant="body1">{userData?.name}</Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Email
                    </Typography>
                    <Typography variant="body1">{userData?.email}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <WorkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Área
                    </Typography>
                    <Typography variant="body1">{userData?.area || 'No especificada'}</Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <LocationOnIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Ubicación
                    </Typography>
                    <Typography variant="body1">{userData?.location || 'No especificada'}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfileView;