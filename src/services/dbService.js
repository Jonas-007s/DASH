// Servicio para simular operaciones de base de datos
import { mockData } from '../utils/mockData';

class DbService {
  constructor() {
    this.data = mockData;
    this.listeners = {};
  }

  // Buscar un registro por criterios
  async findOne(collection, criteria) {
    if (!this.data[collection]) {
      return null;
    }

    return this.data[collection].find(item => {
      return Object.keys(criteria).every(key => {
        return item[key] === criteria[key];
      });
    });
  }

  // Buscar todos los registros que coincidan con los criterios
  async find(collection, criteria = {}) {
    if (!this.data[collection]) {
      return [];
    }

    if (Object.keys(criteria).length === 0) {
      return [...this.data[collection]];
    }

    return this.data[collection].filter(item => {
      return Object.keys(criteria).every(key => {
        return item[key] === criteria[key];
      });
    });
  }

  // Insertar un nuevo registro
  async insert(collection, document) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }

    const newId = this.data[collection].length > 0 
      ? Math.max(...this.data[collection].map(item => item.id)) + 1 
      : 1;

    const newDocument = { ...document, id: newId };
    this.data[collection].push(newDocument);
    
    // Emitir evento de cambio
    this.emitChange(collection, 'insert', newDocument);
    
    return newDocument;
  }

  // Actualizar un registro existente
  async update(collection, id, updates) {
    if (!this.data[collection]) {
      return null;
    }

    const index = this.data[collection].findIndex(item => item.id === id);
    if (index === -1) {
      return null;
    }

    const updatedDocument = { ...this.data[collection][index], ...updates };
    this.data[collection][index] = updatedDocument;
    
    // Emitir evento de cambio
    this.emitChange(collection, 'update', updatedDocument);
    
    return updatedDocument;
  }

  // Eliminar un registro
  async delete(collection, id) {
    if (!this.data[collection]) {
      return false;
    }

    // Guardar el documento antes de eliminarlo para incluirlo en el evento
    const documentToDelete = this.data[collection].find(item => item.id === id);
    
    const initialLength = this.data[collection].length;
    this.data[collection] = this.data[collection].filter(item => item.id !== id);
    const deleted = this.data[collection].length !== initialLength;
    
    // Emitir evento de cambio si se eliminó el documento
    if (deleted && documentToDelete) {
      this.emitChange(collection, 'delete', documentToDelete);
    }
    
    return deleted;
  }

  // Suscribirse a cambios en una colección
  subscribe(collection, listener) {
    if (!this.listeners[collection]) {
      this.listeners[collection] = [];
    }
    
    this.listeners[collection].push(listener);
    
    // Devolver función para cancelar la suscripción
    return () => {
      this.listeners[collection] = this.listeners[collection].filter(l => l !== listener);
    };
  }
  
  // Emitir evento de cambio
  emitChange(collection, action, document) {
    if (!this.listeners[collection]) return;
    
    // Notificar a todos los suscriptores
    this.listeners[collection].forEach(listener => {
      listener({
        action,
        collection,
        document
      });
    });
  }
}

export default new DbService();
