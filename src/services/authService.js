import AUTH_CONFIG from '../config/auth';
import dbService from './dbService';

class AuthService {
  constructor() {
    this.tokenKey = 'auth_token';
    this.userKey = 'user_data';
  }

  async login(credentials) {
    try {
      const { email, password, companyId } = credentials;
      
      // Validar credenciales
      // Asegurarse de que companyId sea un número para la comparación
      const companyIdNum = typeof companyId === 'string' ? parseInt(companyId, 10) : companyId;
      
      const user = await dbService.findOne('users', { 
        email, 
        company_id: companyIdNum 
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // En un entorno real, aquí se verificaría el hash de la contraseña
      if (password !== user.password) {
        throw new Error('Contraseña incorrecta');
      }

      // Generar token (simulado)
      const token = Math.random().toString(36).substring(2);
      
      // Guardar datos de sesión
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        area: user.area,
        companyId: user.company_id,
        location: user.location
      };

      // Guardar token y datos de usuario usando los métodos de la clase
      this.setToken(token);
      this.setUserData(userData);
      
      return userData;
    } catch (error) {
      throw new Error(`Error en el inicio de sesión: ${error.message}`);
    }
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.clear();
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  getUserData() {
    const data = localStorage.getItem(this.userKey);
    return data ? JSON.parse(data) : null;
  }

  setUserData(userData) {
    localStorage.setItem(this.userKey, JSON.stringify(userData));
  }

  hasPermission(requiredRole) {
    const userData = this.getUserData();
    if (!userData) return false;

    const userRole = userData.role;
    const roleConfig = AUTH_CONFIG.roles[userRole];
    
    if (!roleConfig) return false;
    
    // Si el usuario es admin, tiene todos los permisos
    if (userRole === 'admin') return true;
    
    // Verificar si el rol del usuario tiene el permiso requerido
    if (typeof requiredRole === 'string') {
      return roleConfig.permissions.includes(requiredRole);
    }
    
    // Si se requieren múltiples permisos (array)
    if (Array.isArray(requiredRole)) {
      return requiredRole.every(permission => roleConfig.permissions.includes(permission));
    }
    
    return false;
  }
}

export default new AuthService();