/**
 * JSON Server Service
 * Handles all communication with the JSON Server backend
 */

const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');
const { ServiceUnavailableError, NotFoundError, ValidationError } = require('../middleware/errorHandler');

class JsonServerService {
  constructor() {
    this.baseURL = config.jsonServer.url;
    this.timeout = config.jsonServer.timeout;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        config.metadata = { startTime };
        
        logger.debug('📡 JSON Server Request', {
          method: config.method.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          params: config.params,
          timestamp: new Date().toISOString(),
        });
        
        return config;
      },
      (error) => {
        logger.error('❌ JSON Server Request Error', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        const endTime = Date.now();
        const duration = endTime - response.config.metadata.startTime;
        
        logger.debug('✅ JSON Server Response', {
          method: response.config.method.toUpperCase(),
          url: response.config.url,
          status: response.status,
          duration: `${duration}ms`,
          dataSize: JSON.stringify(response.data).length,
          timestamp: new Date().toISOString(),
        });
        
        // Log performance warning for slow requests
        if (duration > 1000) {
          logger.warn('⚠️ Slow JSON Server Response', {
            url: response.config.url,
            duration: `${duration}ms`,
          });
        }
        
        return response;
      },
      (error) => {
        const endTime = Date.now();
        const duration = error.config?.metadata ? endTime - error.config.metadata.startTime : 0;
        
        logger.error('❌ JSON Server Response Error', {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        });
        
        return Promise.reject(this.handleError(error));
      }
    );
  }
  
  /**
   * Handle and transform axios errors
   */
  handleError(error) {
    if (error.code === 'ECONNREFUSED') {
      return new ServiceUnavailableError('JSON Server is not available');
    }
    
    if (error.code === 'ECONNABORTED') {
      return new ServiceUnavailableError('JSON Server request timeout');
    }
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 404:
          return new NotFoundError('Requested resource');
        case 400:
          return new ValidationError(data?.message || 'Invalid request');
        case 500:
          return new ServiceUnavailableError('JSON Server internal error');
        default:
          return new ServiceUnavailableError(`JSON Server error (${status})`);
      }
    }
    
    return error;
  }
  
  /**
   * Health check for JSON Server
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/db');
      return {
        status: 'healthy',
        responseTime: response.headers['x-response-time'] || 'N/A',
        dataSize: JSON.stringify(response.data).length,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get all records from a collection
   */
  async getAll(collection, queryParams = {}) {
    try {
      const response = await this.client.get(`/${collection}`, {
        params: queryParams,
      });
      
      return {
        data: response.data,
        total: response.data.length,
        headers: response.headers,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get a single record by ID
   */
  async getById(collection, id) {
    try {
      const response = await this.client.get(`/${collection}/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Create a new record
   */
  async create(collection, data) {
    try {
      const response = await this.client.post(`/${collection}`, data);
      
      logger.info('📝 Created new record', {
        collection,
        id: response.data.id,
        timestamp: new Date().toISOString(),
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Update a record by ID
   */
  async update(collection, id, data) {
    try {
      const response = await this.client.put(`/${collection}/${id}`, data);
      
      logger.info('✏️ Updated record', {
        collection,
        id,
        timestamp: new Date().toISOString(),
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Partially update a record by ID
   */
  async patch(collection, id, data) {
    try {
      const response = await this.client.patch(`/${collection}/${id}`, data);
      
      logger.info('🔧 Patched record', {
        collection,
        id,
        fields: Object.keys(data),
        timestamp: new Date().toISOString(),
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Delete a record by ID
   */
  async delete(collection, id) {
    try {
      await this.client.delete(`/${collection}/${id}`);
      
      logger.info('🗑️ Deleted record', {
        collection,
        id,
        timestamp: new Date().toISOString(),
      });
      
      return { success: true, id };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Search records with query
   */
  async search(collection, query, queryParams = {}) {
    try {
      const params = {
        q: query,
        ...queryParams,
      };
      
      const response = await this.client.get(`/${collection}`, { params });
      
      return {
        data: response.data,
        total: response.data.length,
        query,
        headers: response.headers,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get records with pagination
   */
  async paginate(collection, page = 1, limit = 10, queryParams = {}) {
    try {
      const params = {
        _page: page,
        _limit: limit,
        ...queryParams,
      };
      
      const response = await this.client.get(`/${collection}`, { params });
      
      // Extract pagination info from headers
      const totalCount = parseInt(response.headers['x-total-count'] || response.data.length);
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        data: response.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        headers: response.headers,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get records with sorting
   */
  async sort(collection, sortBy, order = 'asc', queryParams = {}) {
    try {
      const params = {
        _sort: sortBy,
        _order: order,
        ...queryParams,
      };
      
      const response = await this.client.get(`/${collection}`, { params });
      
      return {
        data: response.data,
        total: response.data.length,
        sort: { field: sortBy, order },
        headers: response.headers,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get filtered records
   */
  async filter(collection, filters = {}, queryParams = {}) {
    try {
      const params = {
        ...filters,
        ...queryParams,
      };
      
      const response = await this.client.get(`/${collection}`, { params });
      
      return {
        data: response.data,
        total: response.data.length,
        filters,
        headers: response.headers,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

// Create singleton instance
const jsonServerService = new JsonServerService();

module.exports = jsonServerService;