import React, { useState, useEffect } from 'react';
import {
  Box,
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  Button,
  Alert,
  Chip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import relativeTime from 'dayjs/plugin/relativeTime';

// Configurar dayjs
dayjs.extend(relativeTime);
dayjs.locale('es');

/**
 * Componente de centro de notificaciones reutilizable
 * @param {Array} notifications - Lista de notificaciones
 * @param {Function} onDismiss - Función para descartar una notificación
 * @param {Function} onDismissAll - Función para descartar todas las notificaciones
 * @param {Function} onNotificationClick - Función opcional para manejar el clic en una notificación
 */
const NotificationCenter = ({ 
  notifications = [], 
  onDismiss, 
  onDismissAll,
  onNotificationClick
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Actualizar contador de no leídas
  useEffect(() => {
    setUnreadCount(notifications.filter(notification => !notification.read).length);
  }, [notifications]);

  const handleOpenNotifications = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    // Cerrar el popover después de hacer clic en una notificación
    handleCloseNotifications();
  };

  const handleDismiss = (event, notificationId) => {
    event.stopPropagation(); // Evitar que se propague al clic de la notificación
    if (onDismiss) {
      onDismiss(notificationId);
    }
  };

  const handleDismissAll = () => {
    if (onDismissAll) {
      onDismissAll();
    }
    handleCloseNotifications();
  };

  // Formatear fecha relativa
  const formatRelativeTime = (date) => {
    const dateObj = dayjs(date);
    if (!dateObj.isValid()) return 'Fecha desconocida';
    
    const now = dayjs();
    const diffInMinutes = now.diff(dateObj, 'minute');
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = now.diff(dateObj, 'hour');
    if (diffInHours < 24) return `Hace ${diffInHours} h`;
    
    return dateObj.format('DD MMM, HH:mm');
  };

  // Determinar color según severidad
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'success': return 'success';
      default: return 'default';
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <IconButton 
        color="inherit" 
        aria-label="notificaciones"
        onClick={handleOpenNotifications}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseNotifications}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notificaciones</Typography>
          {notifications.length > 0 && (
            <Button size="small" onClick={handleDismissAll}>
              Limpiar todo
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No hay notificaciones
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <ListItem 
                key={notification.id} 
                divider 
                alignItems="flex-start"
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                  bgcolor: notification.read ? 'inherit' : 'action.selected'
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Chip 
                      label={notification.area || 'Sistema'} 
                      size="small" 
                      color={getSeverityColor(notification.severity)}
                      sx={{ height: 20 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatRelativeTime(notification.date)}
                    </Typography>
                  </Box>
                  
                  <Alert 
                    severity={notification.severity || 'info'}
                    sx={{ py: 0, mb: 1 }}
                    onClose={(event) => handleDismiss(event, notification.id)}
                  >
                    {notification.message}
                  </Alert>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
};

export default NotificationCenter;