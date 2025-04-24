// Configuración de autenticación y permisos

const AUTH_CONFIG = {
  roles: {
    admin: {
      level: 3,
      permissions: [
        'view_dashboard',
        'view_orders',
        'create_order',
        'edit_order',
        'delete_order',
        'update_order_status',
        'assign_order',
        'add_order_comment',
        'manage_users',
        'view_products',
        'create_product',
        'edit_product',
        'delete_product'
      ]
    },
    supervisor: {
      level: 2,
      permissions: [
        'view_dashboard',
        'view_orders',
        'create_order',
        'edit_order',
        'update_order_status',
        'assign_order',
        'add_order_comment',
        'view_products',
        'create_product',
        'edit_product'
      ]
    },
    operador: {
      level: 1,
      permissions: [
        'view_dashboard',
        'view_orders',
        'create_order',
        'update_order_status',
        'add_order_comment',
        'view_products',
        'create_product',
        'edit_product'
      ]
    },
    client: {
      level: 0,
      permissions: [
        'view_dashboard',
        'view_orders',
        'create_order',
        'add_order_comment',
        'view_products'
      ]
    }
  }
};

export default AUTH_CONFIG;