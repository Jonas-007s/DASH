import React, { useState, useEffect, useCallback } from 'react';
import { 
  Grid, Paper, Typography, Box, Card, CardContent, CardHeader, 
  Divider, FormControl, InputLabel, Select, MenuItem, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  TablePagination, Chip, Button, TextField, Alert, IconButton,
  Tabs, Tab, Tooltip as MuiTooltip
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import authService from '../services/authService';
import dbService from '../services/dbService';
import notificationService from '../services/notificationService';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';

// Configurar plugins de dayjs
dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.locale('es');

// Componentes personalizados
import NotificationCenter from '../components/Notifications/NotificationCenter';
import AreaStatCard from '../components/Dashboard/AreaStatCard';

// Colores para las áreas
const areaColors = {
  Outbound: '#2196f3',
  Inbound: '#ff9800',
  Quality: '#4caf50',
  Packing: '#9c27b0',
  WoodShop: '#f44336',
  Deviation: '#00bcd4'
};

// Función para generar datos de tendencia

// Función para generar datos de tendencia
const generateTrendData = (baseValue, days = 30) => {
  return Array.from({ length: days }, (_, i) => {
    const date = dayjs().subtract(days - i - 1, 'day');
    const value = baseValue + Math.floor(Math.random() * 5) - 2;
    return {
      date: date.format('DD/MM'),
      value: value > 0 ? value : 0
    };
  });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const userData = authService.getUserData();
  console.log('Dashboard: Rendering component. UserData:', userData);
  const userRole = userData?.role || 'guest';
  const [areas] = useState([
    'Outbound',
    'Inbound',
    'Quality',
    'Packing',
    'WoodShop',
    'Deviation'
  ]);
  const [areaStats, setAreaStats] = useState([]);
  const [areaChartData, setAreaChartData] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [areaProducts, setAreaProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [trendData, setTrendData] = useState({});
  const [notifications, setNotifications] = useState([]);
  
  // Nuevos estados para las mejoras
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().subtract(30, 'day').toDate(),
    endDate: dayjs().toDate()
  });
  const [tabValue, setTabValue] = useState(0);

  // Navegar a la lista de productos filtrada por área
  const handleAreaClick = (areaName) => {
    navigate('/products', { state: { filterArea: areaName } });
  };
  
  // Función para actualizar estadísticas - definida antes de ser usada en useEffect
  const loadAreaStats = useCallback(async () => {
    console.log('Dashboard: loadAreaStats called.');
    try {
      // Obtener usuarios y productos para contar por área
      const users = await dbService.find('users');
      const products = await dbService.find('products') || [];
      console.log('Dashboard: Fetched users:', users.length, 'Fetched products:', products.length);
      
      // Contar usuarios y productos por área
      const areaCounts = {};
      areas.forEach(area => {
        // Contar usuarios por área
        const userCount = users.filter(user => user.area === area).length;
        
        // Contar productos por área
        const productCount = products.filter(product => product.area === area).length;
        
        // Guardar el total (productos)
        areaCounts[area] = productCount;
      });
      
      // Crear estadísticas por área
      const stats = areas.map(area => ({
        name: area,
        count: areaCounts[area] || 0,
        color: areaColors[area] || '#999'
      }));
      
      setAreaStats(stats);
      
      // Crear datos para el gráfico de barras
      // Usamos datos reales de productos por mes si están disponibles
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May'];
      const chartData = months.map(month => {
        const monthData = { name: month };
        areas.forEach(area => {
          // En un sistema real, aquí obtendríamos datos históricos por mes
          // Por ahora, usamos los datos actuales de productos
          monthData[area] = areaCounts[area] || 0;
        });
        return monthData;
      });
      
      setAreaChartData(chartData);
      
      // Generar datos de tendencia para cada área
      const trends = {};
      areas.forEach(area => {
        trends[area] = generateTrendData(areaCounts[area] || 5);
      });
      setTrendData(trends);
      
      // Verificar productos con baja cantidad y generar notificaciones
      products.forEach(product => {
        if (product.quantity <= 3) {
          // Crear notificación solo si no existe una similar
          const existingNotification = notificationService.getNotifications().find(
            n => n.type === 'product' && n.productId === product.id && n.severity === 'warning'
          );
          
          if (!existingNotification) {
            notificationService.createLowStockNotification(product);
          }
        }
      });
      
    } catch (error) {
      console.error('Error al cargar estadísticas por área:', error);
    }
  }, [areas]);

  // Cargar estadísticas iniciales al montar el componente
  useEffect(() => {
    console.log('Dashboard: Initial mount useEffect triggered.');
    loadAreaStats();
  }, [loadAreaStats]); // Dependencia de loadAreaStats (memoizada)

  // Suscribirse a cambios en productos para actualizar estadísticas
  useEffect(() => {
    let isMounted = true;
    console.log('Dashboard: Product subscription useEffect triggered.');
    
    // Asegurar que las colecciones existan
    if (!dbService.data.products) {
      dbService.data.products = [];
    }
    if (!dbService.data.orders) {
      dbService.data.orders = [];
    }

    // Suscribirse a cambios en productos
    const unsubscribeProducts = dbService.subscribe('products', (change) => {
      console.log('Dashboard: Product change detected:', change);
      if (isMounted) {
        loadAreaStats(); // Actualizar estadísticas cuando cambian los productos
      }
    });

    return () => {
      isMounted = false;
      console.log('Dashboard: Unsubscribing from product changes.');
      unsubscribeProducts();
    };
  }, [loadAreaStats]); // loadAreaStats está memoizado con useCallback, así que es seguro usarlo como dependencia

  // Cargar notificaciones
  useEffect(() => {
    const loadNotifications = () => {
      const allNotifications = notificationService.getNotifications();
      setNotifications(allNotifications);
    };

    // Cargar notificaciones iniciales
    loadNotifications();

    // Suscribirse a cambios en las notificaciones
    const unsubscribe = notificationService.subscribe(loadNotifications);

    return () => {
      // Limpiar suscripción al desmontar
      unsubscribe();
    };
  }, []);



  // Cargar estadísticas por área inicialmente
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        // Asegurarse de que la colección de productos exista
        const products = await dbService.find('products');
        if (!products) {
          // Inicializar la colección si no existe
          dbService.data.products = [];
        }
        // Cargar estadísticas solo si el componente sigue montado
        if (isMounted) {
          await loadAreaStats();
        }
      } catch (error) {
        console.error('Error al inicializar datos:', error);
      }
    };
    
    // Cargar datos inicialmente
    initializeData();

    // Limpiar y marcar componente como desmontado
    return () => {
      isMounted = false;
    };
  }, [loadAreaStats]); // Solo se ejecuta una vez al montar el componente y cuando cambia loadAreaStats
  
  // Cargar productos del área seleccionada y suscribirse a cambios
  useEffect(() => {
    let isMounted = true;

    const loadAreaProducts = async () => {
      if (!selectedArea) {
        if (isMounted) {
          setAreaProducts([]);
        }
        return;
      }
      
      try {
        const products = await dbService.find('products') || [];
        let filteredProducts = products.filter(product => product.area === selectedArea);
        
        // Aplicar filtro de fecha si está configurado
        if (dateRange.startDate && dateRange.endDate) {
          filteredProducts = filteredProducts.filter(product => {
            // Verificar si product.created_at existe antes de intentar parsearlo
            if (!product.created_at) return false;
            
            // Usar dayjs para parsear la fecha
            const productDate = dayjs(product.created_at);
            if (!productDate.isValid()) return false;
            
            // Convertir fechas de filtro a dayjs
            const start = dayjs(dateRange.startDate);
            const end = dayjs(dateRange.endDate).endOf('day'); // Incluir todo el día
            
            // Verificar si la fecha del producto está entre las fechas de filtro
            return productDate.isBetween(start, end, null, '[]'); // '[]' incluye los límites
          });
        }
        
        // Ordenar productos por fecha de creación (más recientes primero)
        filteredProducts.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        
        if (isMounted) {
          setAreaProducts(filteredProducts);

          // Verificar productos con bajo stock
          filteredProducts.forEach(product => {
            if (product.quantity <= 3) {
              notificationService.createLowStockNotification(product);
            }
          });
        }
      } catch (error) {
        console.error(`Error al cargar productos del área ${selectedArea}:`, error);
      }
    };
    
    // Cargar productos inicialmente
    loadAreaProducts();

    // Suscribirse a cambios en la base de datos
    const unsubscribe = dbService.subscribe('products', () => {
      if (isMounted) {
        loadAreaProducts();
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [selectedArea, dateRange]);
  
  const handleAreaChange = (event) => {
    setSelectedArea(event.target.value);
    setPage(0);
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleViewProductDetail = (productId) => {
    navigate(`/products/${productId}`);
  };
  
  // Manejadores para las nuevas funcionalidades
  const handleDateChange = (newValue, field) => {
    setDateRange(prev => ({
      ...prev,
      [field]: newValue
    }));
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    console.log('Dashboard: Tab changed to', newValue);
  };

  const handleDismissNotification = (notificationId) => {
    notificationService.removeNotification(notificationId);
  };
  
  const handleDismissAllNotifications = () => {
    notificationService.clearAllNotifications();
  };
  
  const handleNotificationClick = (notification) => {
    // Marcar como leída
    notificationService.markAsRead(notification.id);
    
    // Si es una notificación de producto, navegar al área correspondiente
    if (notification.type === 'product' && notification.productId) {
      // Intenta encontrar el producto en los datos generales si areaProducts no está actualizado
      dbService.findOne('products', { id: notification.productId }).then(product => {
        if (product) {
          setSelectedArea(product.area);
        }
      });
    }
  };
  
  // Función para determinar si un área tiene tendencia positiva o negativa
  const getTrendDirection = (areaName) => {
    if (!trendData[areaName] || trendData[areaName].length < 2) return 'neutral';
    
    const data = trendData[areaName];
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    
    if (lastValue > firstValue) return 'up';
    if (lastValue < firstValue) return 'down';
    return 'neutral';
  };

  // Renderizado del componente
  console.log('Dashboard: Preparing to render. AreaStats:', areaStats);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          {/* Tarjeta de bienvenida con notificaciones */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  Bienvenido, {userData?.name || 'Usuario'}
                </Typography>
                <Box>
                  <NotificationCenter 
                    notifications={notifications} 
                    onDismiss={handleDismissNotification} 
                    onDismissAll={handleDismissAllNotifications} 
                    onNotificationClick={handleNotificationClick}
                  />
                </Box>
              </Box>
              <Typography variant="body1" gutterBottom>
                Panel de control del sistema de gestión por áreas de trabajo.
              </Typography>
            </Paper>
          </Grid>

          {/* Filtros avanzados */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Filtros Avanzados
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="area-select-label">Seleccionar Área</InputLabel>
                    <Select
                      labelId="area-select-label"
                      id="area-select"
                      value={selectedArea}
                      label="Seleccionar Área"
                      onChange={handleAreaChange}
                    >
                      <MenuItem value=""><em>Todas las áreas</em></MenuItem>
                      {areas.map((area) => (
                        <MenuItem key={area} value={area}>{area}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                   <DatePicker
                     label="Fecha Inicial"
                     value={dayjs(dateRange.startDate)} // Ensure value is a dayjs object
                     onChange={(newValue) => handleDateChange(newValue, 'startDate')}
                     slotProps={{ textField: { fullWidth: true } }}
                   />
                </Grid>
                
                <Grid item xs={12} md={4}>
                   <DatePicker
                     label="Fecha Final"
                     value={dayjs(dateRange.endDate)} // Ensure value is a dayjs object
                     onChange={(newValue) => handleDateChange(newValue, 'endDate')}
                     slotProps={{ textField: { fullWidth: true } }}
                   />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} centered>
                  <Tab label="Productos" />
                  <Tab label="Tendencias" />
                </Tabs>
              </Box>
              
              {selectedArea && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Productos registrados en {selectedArea}
                  </Typography>
                  {areaProducts.length > 0 ? (
                    <>
                      <TableContainer sx={{ mb: 2, maxHeight: 400 }}>
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {areaProducts
                              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                              .map((product) => (
                                <TableRow key={product.id} hover>
                                  <TableCell>{product.code}</TableCell>
                                  <TableCell>{product.description}</TableCell>
                                  <TableCell>{product.quantity}</TableCell>
                                  <TableCell>
                                    <Button 
                                      size="small" 
                                      variant="outlined" 
                                      color="primary"
                                      onClick={() => navigate(`/products`)}
                                    >
                                      Ver Detalles
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={areaProducts.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Filas por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                      />
                    </>
                  ) : (
                    <Typography variant="body1">
                      No hay productos registrados en esta área.
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Tarjetas de estadísticas por área con indicadores de tendencia */}
          {areaStats.map((area) => {
            const trendDirection = getTrendDirection(area.name);
            return (
              <Grid item xs={12} md={4} key={area.name}>
                  <Box
                    onClick={() => handleAreaClick(area.name)}
                    sx={{ cursor: 'pointer', width: '100%' }}
                  >
                    <AreaStatCard 
                      area={area}
                      trendData={trendData[area.name]}
                      // onClick prop removed
                      trendDirection={trendDirection}
                      lowActivityThreshold={3}
                    />
                  </Box>
              </Grid>
            );
          })}

          {/* Visualizaciones según la pestaña seleccionada */}
          <Grid item xs={12}>
            {tabValue === 0 && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Registros por Área y Mes
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={areaChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {areas.map((area) => (
                      <Bar key={area} dataKey={area} name={area} fill={areaColors[area] || '#999'} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            )}
            
            {tabValue === 1 && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Tendencias por Área
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart 
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    data={Object.values(trendData)[0] || []}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      type="category" 
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {Object.entries(trendData).map(([area, data]) => (
                      <Line 
                        key={area}
                        data={data}
                        name={area}
                        type="monotone"
                        dataKey="value"
                        stroke={areaColors[area] || '#999'}
                        activeDot={{ r: 8 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            )}
            
            {/* La pestaña de Actividad con el mapa de calor ha sido eliminada */}
          </Grid>

          {/* Información adicional según el rol */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Acciones Rápidas
              </Typography>
              <Typography variant="body1">
                {userRole === 'admin' && 'Como administrador, puedes gestionar usuarios, crear y asignar órdenes, y ver reportes completos.'}
                {userRole === 'supervisor' && 'Como supervisor, puedes crear órdenes, asignarlas a operadores y revisar el progreso.'}
                {userRole === 'operador' && 'Como operador, puedes ver tus órdenes asignadas y actualizar su estado.'}
                {userRole === 'client' && 'Como cliente, puedes crear nuevas órdenes y revisar el estado de tus solicitudes.'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider> // Correctly close the outer provider
  );
};

export default Dashboard;