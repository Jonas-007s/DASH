// Servicio centralizado para gestión de notificaciones

class NotificationService {
  constructor() {
    this.storageKey = 'app_notifications';
    this.listeners = [];
    this.loadNotifications();
  }

  // Cargar notificaciones desde localStorage
  loadNotifications() {
    try {
      const storedNotifications = localStorage.getItem(this.storageKey);
      this._notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      this._notifications = [];
    }
  }

  // Guardar notificaciones en localStorage
  saveNotifications() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this._notifications));
    } catch (error) {
      console.error('Error al guardar notificaciones:', error);
    }
  }

  // Obtener todas las notificaciones
  getNotifications() {
    return [...this._notifications];
  }

  // Añadir una nueva notificación
  addNotification(notification) {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    this._notifications.unshift(newNotification);
    this.saveNotifications();
    this.notifyListeners();
    return newNotification;
  }

  // Eliminar una notificación por ID
  removeNotification(id) {
    this._notifications = this._notifications.filter(notification => notification.id !== id);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Eliminar todas las notificaciones
  clearAllNotifications() {
    this._notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  // Marcar una notificación como leída
  markAsRead(id) {
    const notification = this._notifications.find(notification => notification.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  // Marcar todas las notificaciones como leídas
  markAllAsRead() {
    this._notifications.forEach(notification => {
      notification.read = true;
    });
    this.saveNotifications();
    this.notifyListeners();
  }

  // Obtener el número de notificaciones no leídas
  getUnreadCount() {
    return this._notifications.filter(notification => !notification.read).length;
  }

  // Suscribirse a cambios en las notificaciones
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notificar a los suscriptores sobre cambios
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.getNotifications()));
  }

  // Crear una notificación para producto con baja cantidad
  createLowStockNotification(product) {
    return this.addNotification({
      title: 'Stock bajo',
      message: `El producto ${product.code} - ${product.description} tiene un stock bajo (${product.quantity} unidades)`,
      severity: 'warning',
      type: 'product',
      productId: product.id
    });
  }

  // Crear una notificación para nuevo producto
  createProductCreatedNotification(product) {
    return this.addNotification({
      title: 'Producto creado',
      message: `Se ha registrado un nuevo producto: ${product.code} - ${product.description}`,
      severity: 'success',
      type: 'product',
      productId: product.id
    });
  }

  // Crear una notificación para producto eliminado
  createProductDeletedNotification(product) {
    return this.addNotification({
      title: 'Producto eliminado',
      message: `Se ha eliminado el producto: ${product.code} - ${product.description}`,
      severity: 'info',
      type: 'product',
      productId: product.id
    });
  }
}

export default new NotificationService();