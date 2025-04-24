# Instrucciones Técnicas para la Implementación

## 1. Sistema de Notificaciones en el Dashboard

### Crear servicio de notificaciones

Crea el archivo `src/services/notificationService.js`:

```javascript
// Servicio para gestionar notificaciones
class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this.loadFromStorage();
  }

  // Cargar notificaciones guardadas
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  }

  // Guardar en localStorage
  saveToStorage() {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error al guardar notificaciones:', error);
    }
  }

  // Obtener todas las notificaciones
  getAll() {
    return [...this.notifications];
  }

  // Añadir nueva notificación
  add(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      read: false,
      date: new Date().toISOString(),
      ...notification
    };
    
    this.notifications.unshift(newNotification);
    this.saveToStorage();
    this.notifyListeners();
    
    return newNotification;
  }

  // Marcar como leída
  markAsRead(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications[index].read = true;
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Eliminar notificación
  remove(id) {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.id !== id);
    
    if (initialLength !== this.notifications.length) {
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Eliminar todas las notificaciones
  removeAll() {
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  // Suscribirse a cambios
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notificar a los suscriptores
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Crear notificación para nuevo producto
  notifyNewProduct(product) {
    return this.add({
      message: `Nuevo producto registrado: ${product.code}`,
      area: product.area,
      severity: 'success',
      type: 'product_created'
    });
  }

  // Crear notificación para producto eliminado
  notifyProductDeleted(product) {
    return this.add({
      message: `Producto eliminado: ${product.code}`,
      area: product.area,
      severity: 'warning',
      type: 'product_deleted'
    });
  }

  // Crear alerta para baja cantidad
  notifyLowQuantity(product) {
    return this.add({
      message: `Cantidad baja del producto: ${product.code}`,
      area: product.area,
      severity: 'error',
      type: 'low_quantity'
    });
  }
}

export default new NotificationService();
```

### Integrar notificaciones en ProductRegistration.jsx

Modifica la función `handleSubmit` en `ProductRegistration.jsx`:

```javascript
import notificationService from '../../services/notificationService';

// En la función handleSubmit, después de crear el producto:
const handleSubmit = async (e) => {
  // ... código existente ...
  
  try {
    // ... código existente ...
    
    // Crear el producto en la base de datos
    const newProduct = await dbService.insert('products', product);
    
    // Añadir notificación
    notificationService.notifyNewProduct(newProduct);
    
    // ... resto del código existente ...
  } catch (err) {
    // ... código existente ...
  }
};
```

### Integrar notificaciones en ProductList.jsx

Modifica la función `confirmDeleteProduct` en `ProductList.jsx`:

```javascript
import notificationService from '../../services/notificationService';

// En la función confirmDeleteProduct:
const confirmDeleteProduct = async () => {
  try {
    setLoading(true);
    const success = await dbService.delete('products', productToDelete.id);
    if (success) {
      // Notificar eliminación
      notificationService.notifyProductDeleted(productToDelete);
      
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
```

## 2. Corrección del Filtrado por Fecha

### Implementar filtrado por fecha en ProductList.jsx

Añade estos imports en `ProductList.jsx`:

```javascript
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import { isWithinInterval, parseISO } from 'date-fns';
```

Añade estos estados:

```javascript
const [dateRange, setDateRange] = useState({
  startDate: null,
  endDate: null
});
const [filterDialogOpen, setFilterDialogOpen] = useState(false);
```

Modifica la función de filtrado de productos:

```javascript
// Filtrar productos
useEffect(() => {
  if (searchTerm.trim() === '' && !dateRange.startDate && !dateRange.endDate) {
    setFilteredProducts(products);
    return;
  }
  
  let filtered = [...products];
  
  // Filtrar por término de búsqueda
  if (searchTerm.trim() !== '') {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(product => 
      product.code.toLowerCase().includes(term) || 
      product.description.toLowerCase().includes(term) ||
      product.area.toLowerCase().includes(term)
    );
  }
  
  // Filtrar por rango de fechas
  if (dateRange.startDate && dateRange.endDate) {
    filtered = filtered.filter(product => {
      const productDate = parseISO(product.created_at);
      return isWithinInterval(productDate, {
        start: dateRange.startDate,
        end: dateRange.endDate
      });
    });
  }
  
  setFilteredProducts(filtered);
}, [products, searchTerm, dateRange]);
```

Añade el diálogo de filtro por fecha:

```jsx
<Dialog
  open={filterDialogOpen}
  onClose={() => setFilterDialogOpen(false)}
  PaperProps={{
    sx: { borderRadius: 3, p: 2 }
  }}
>
  <DialogTitle>Filtrar por fecha</DialogTitle>
  <DialogContent>
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        <DatePicker
          label="Fecha inicial"
          value={dateRange.startDate}
          onChange={(newValue) => setDateRange(prev => ({ ...prev, startDate: newValue }))}
        />
        <DatePicker
          label="Fecha final"
          value={dateRange.endDate}
          onChange={(newValue) => setDateRange(prev => ({ ...prev, endDate: newValue }))}
        />
      </Box>
    </LocalizationProvider>
  </DialogContent>
  <DialogActions>
    <Button 
      onClick={() => setDateRange({ startDate: null, endDate: null })}
      color="inherit"
    >
      Limpiar
    </Button>
    <Button 
      onClick={() => setFilterDialogOpen(false)}
      variant="contained"
    >
      Aplicar
    </Button>
  </DialogActions>
</Dialog>
```

Añade un botón para abrir el diálogo de filtro junto al buscador:

```jsx
<Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
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
  <Button
    variant="outlined"
    startIcon={<FilterListIcon />}
    onClick={() => setFilterDialogOpen(true)}
    sx={{ borderRadius: 2, minWidth: 120 }}
  >
    Filtrar
  </Button>
</Box>
```

## 3. Integración entre Registro de Productos y Dashboard

### Modificar dbService.js para emitir eventos

Actualiza `dbService.js` para añadir sistema de eventos:

```javascript
// Añadir al inicio de la clase DbService
constructor() {
  this.data = mockData;
  this.listeners = {};
}

// Añadir estos métodos al final de la clase
// Suscribirse a cambios en una colección
subscribe(collection, callback) {
  if (!this.listeners[collection]) {
    this.listeners[collection] = [];
  }
  this.listeners[collection].push(callback);
  
  // Devolver función para cancelar suscripción
  return () => {
    this.listeners[collection] = this.listeners[collection].filter(cb => cb !== callback);
  };
}

// Notificar a los suscriptores
notify(collection, action, data) {
  if (this.listeners[collection]) {
    this.listeners[collection].forEach(callback => {
      callback({ action, data });
    });
  }
}

// Modificar los métodos insert, update y delete para notificar
// En el método insert, añadir al final:
async insert(collection, document) {
  // ... código existente ...
  
  this.notify(collection, 'insert', newDocument);
  return newDocument;
}

// En el método update, añadir al final:
async update(collection, id, updates) {
  // ... código existente ...
  
  this.notify(collection, 'update', updatedDocument);
  return updatedDocument;
}

// En el método delete, añadir antes del return:
async delete(collection, id) {
  // ... código existente ...
  
  if (initialLength !== this.data[collection].length) {
    this.notify(collection, 'delete', { id });
    return true;
  }
  return false;
}
```

### Actualizar Dashboard.jsx para escuchar cambios

Modifica `Dashboard.jsx` para suscribirse a cambios en productos:

```javascript
// En el useEffect que carga estadísticas por área
useEffect(() => {
  const loadAreaStats = async () => {
    // ... código existente ...
  };

  loadAreaStats();
  
  // Suscribirse a cambios en productos
  const unsubscribe = dbService.subscribe('products', ({ action, data }) => {
    // Recargar estadísticas cuando cambian los productos
    loadAreaStats();
  });
  
  // Limpiar suscripción al desmontar
  return () => unsubscribe();
}, [areas]);
```

## 4. Funcionalidad de Edición y Eliminación de Productos

### Mejorar diálogo de confirmación de eliminación

Actualiza el diálogo de confirmación en `ProductList.jsx`:

```jsx
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DialogContentText>
        ¿Está seguro que desea eliminar el siguiente producto? Esta acción no se puede deshacer.
      </DialogContentText>
      
      {productToDelete && (
        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Código: {productToDelete.code}
          </Typography>
          <Typography variant="body2">
            Descripción: {productToDelete.description || 'Sin descripción'}
          </Typography>
          <Typography variant="body2">
            Área: {productToDelete.area}
          </Typography>
          <Typography variant="body2">
            Cantidad: {productToDelete.quantity}
          </Typography>
        </Box>
      )}
    </Box>
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
      startIcon={<DeleteIcon />}
    >
      Eliminar
    </Button>
  </DialogActions>
</Dialog>
```

## 5. Implementación de Roles de Usuario

### Actualizar referencias de 'técnico' a 'operador'

En `OrderCreate.jsx`, actualiza la función que carga técnicos:

```javascript
// Cargar técnicos disponibles si el usuario es admin o supervisor
React.useEffect(() => {
  const loadTechnicians = async () => {
    if (userData?.role === 'admin' || userData?.role === 'supervisor') {
      try {
        const techData = await dbService.find('users', { role: 'operador' });
        setTechnicians(techData);
      } catch (err) {
        console.error('Error al cargar operadores:', err);
      }
    }
  };
  
  loadTechnicians();
}, [userData?.role]);
```

Actualiza también las referencias en la interfaz:

```jsx
<FormControl fullWidth>
  <InputLabel>Asignar a Operador</InputLabel>
  <Select
    name="assigned_to"
    value={order.assigned_to || ''}
    label="Asignar a Operador"
    onChange={handleChange}
    disabled={loading || success}
  >
    <MenuItem value="">Sin asignar</MenuItem>
    {technicians.map(tech => (
      <MenuItem key={tech.id} value={tech.id}>
        {tech.name}
      </MenuItem>
    ))}
  </Select>
</FormControl>
```

## Verificación Final

Para verificar que todas las implementaciones funcionen correctamente:

1. Registra un nuevo producto y confirma que aparezca una notificación
2. Elimina un producto y verifica que se muestre la confirmación mejorada
3. Comprueba que las estadísticas del Dashboard se actualicen automáticamente
4. Prueba el filtrado por fecha en la lista de productos
5. Verifica que todas las referencias a 'técnico' se hayan cambiado a 'operador'