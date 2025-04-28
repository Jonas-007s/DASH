// Datos de prueba para simular una base de datos

export const mockData = {
  users: [
    {
      id: 1,
      name: 'Administrador',
      email: 'admin@empresa.com',
      password: 'admin123',
      role: 'admin',
      area: 'Administración',
      company_id: 1,
      location: 'Sede Central'
    },
    {
      id: 2,
      name: 'Técnico',
      email: 'tecnico@empresa.com',
      password: 'tecnico123',
      role: 'operador',
      area: 'Mantenimiento',
      company_id: 1,
      location: 'Sede Central'
    },
    {
      id: 3,
      name: 'Supervisor',
      email: 'supervisor@empresa.com',
      password: 'super123',
      role: 'supervisor',
      area: 'Operaciones',
      company_id: 1,
      location: 'Sede Norte'
    }
  ],
  companies: [
    {
      id: 1,
      name: 'Empresa Principal',
      address: 'Calle Principal 123',
      phone: '123-456-7890',
      email: 'contacto@empresa.com'
    },
    {
      id: 2,
      name: 'Empresa Secundaria',
      address: 'Avenida Secundaria 456',
      phone: '098-765-4321',
      email: 'contacto@secundaria.com'
    }
  ],
  orders: [
    {
      id: 1,
      title: 'Mantenimiento preventivo',
      description: 'Realizar mantenimiento preventivo de equipos de aire acondicionado',
      status: 'pending',
      priority: 'medium',
      created_at: '2023-05-10T10:30:00',
      company_id: 1,
      location: 'Sede Central - Piso 3',
      photos: [],
      comments: [
        {
          id: 1,
          user_id: 1,
          text: 'Asignada al técnico',
          timestamp: '2023-05-10T11:00:00'
        }
      ]
    },
    {
      id: 2,
      title: 'Reparación de equipo',
      description: 'Reparar equipo de refrigeración en mal estado',
      status: 'in_progress',
      priority: 'high',
      created_at: '2023-05-09T08:15:00',
      company_id: 1,
      location: 'Sede Norte - Almacén',
      photos: [],
      comments: [
        {
          id: 2,
          user_id: 2,
          text: 'Iniciando revisión del equipo',
          timestamp: '2023-05-09T09:30:00'
        },
        {
          id: 3,
          user_id: 2,
          text: 'Se requieren repuestos adicionales',
          timestamp: '2023-05-09T10:45:00'
        }
      ]
    },
    {
      id: 3,
      title: 'Instalación de equipo nuevo',
      description: 'Instalar nuevo sistema de aire acondicionado en oficina de gerencia',
      status: 'completed',
      priority: 'medium',
      created_at: '2023-05-05T14:20:00',
      completed_at: '2023-05-07T16:30:00',
      company_id: 1,
      location: 'Sede Central - Oficina Gerencia',
      photos: [],
      comments: [
        {
          id: 4,
          user_id: 2,
          text: 'Instalación completada con éxito',
          timestamp: '2023-05-07T16:25:00'
        },
        {
          id: 5,
          user_id: 3,
          text: 'Verificado y aprobado',
          timestamp: '2023-05-07T17:00:00'
        }
      ]
    }
  ],
  products: [
    {
      id: 1,
      code: 'PROD-001',
      description: 'Componente Electrónico A',
      area: 'Inbound',
      quantity: 150,
      created_at: '2023-05-15T09:00:00',
      supplier: 'Proveedor X',
      status: 'available'
    },
    {
      id: 2,
      code: 'PROD-002',
      description: 'Pieza Mecánica B',
      area: 'Outbound',
      quantity: 2,
      created_at: '2023-05-16T11:30:00',
      supplier: 'Proveedor Y',
      status: 'low_stock'
    },
    {
      id: 3,
      code: 'PROD-003',
      description: 'Material de Embalaje C',
      area: 'Packing',
      quantity: 500,
      created_at: '2023-05-16T14:00:00',
      supplier: 'Proveedor Z',
      status: 'available'
    },
    {
      id: 4,
      code: 'PROD-004',
      description: 'Herramienta Manual D',
      area: 'WoodShop',
      quantity: 25,
      created_at: '2023-05-17T08:45:00',
      supplier: 'Proveedor X',
      status: 'available'
    },
    {
      id: 5,
      code: 'PROD-005',
      description: 'Producto Químico E',
      area: 'Quality',
      quantity: 75,
      created_at: '2023-05-18T10:15:00',
      supplier: 'Proveedor Y',
      status: 'available'
    },
    {
      id: 6,
      code: 'PROD-006',
      description: 'Componente Electrónico F',
      area: 'Inbound',
      quantity: 3,
      created_at: '2023-05-19T16:00:00',
      supplier: 'Proveedor Z',
      status: 'low_stock'
    }
  ]
};

// Constantes para estados y prioridades
export const ORDER_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Función para obtener el texto de estado en español
export const getStatusText = (status) => {
  const statusMap = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada'
  };
  return statusMap[status] || status;
};

// Función para obtener el texto de prioridad en español
export const getPriorityText = (priority) => {
  const priorityMap = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente'
  };
  return priorityMap[priority] || priority;
};