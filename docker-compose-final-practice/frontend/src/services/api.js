import axios from 'axios';

// Create axios instances for different services
const createApiInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      console.log(`API Response: ${response.status} ${response.config.url}`);
      return response.data;
    },
    (error) => {
      console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        throw new Error('Resource not found');
      } else if (error.response?.status === 500) {
        throw new Error('Server error occurred');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - please try again');
      } else if (!error.response) {
        throw new Error('Network error - please check your connection');
      }
      
      throw error;
    }
  );

  return instance;
};

// API Base URLs - using environment variables with fallbacks
const MENU_SERVICE_URL = process.env.REACT_APP_MENU_SERVICE_URL || '/api/menu';
const ORDER_SERVICE_URL = process.env.REACT_APP_ORDER_SERVICE_URL || '/api/orders';

// Create API instances
const menuApi = createApiInstance(MENU_SERVICE_URL);
const orderApi = createApiInstance(ORDER_SERVICE_URL);

// Menu Service API
export const menuAPI = {
  // Get all pizzas from the galactic menu
  getMenu: async () => {
    try {
      return await menuApi.get('/');
    } catch (error) {
      console.error('Failed to fetch galactic menu:', error);
      throw new Error('Unable to load galactic menu. Our quantum servers might be experiencing interference.');
    }
  },

  // Get specific pizza by ID
  getPizza: async (id) => {
    try {
      return await menuApi.get(`/${id}`);
    } catch (error) {
      console.error(`Failed to fetch pizza ${id}:`, error);
      throw new Error('Pizza not found in our galactic database.');
    }
  },

  // Get recommendations for user
  getRecommendations: async (userId) => {
    try {
      return await menuApi.get(`/recommendations/${userId}`);
    } catch (error) {
      console.error(`Failed to fetch recommendations for ${userId}:`, error);
      // Don't throw error for recommendations - it's not critical
      return [];
    }
  },

  // Get popular pizzas from cache
  getPopular: async () => {
    try {
      return await menuApi.get('/popular');
    } catch (error) {
      console.error('Failed to fetch popular pizzas:', error);
      // Don't throw error for popular items - it's not critical
      return [];
    }
  }
};

// Order Service API
export const orderAPI = {
  // Create new order
  createOrder: async (orderData) => {
    try {
      // Validate order data
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Order must contain at least one item');
      }

      if (!orderData.deliveryAddress || !orderData.deliveryAddress.galaxy) {
        throw new Error('Delivery address is required');
      }

      const response = await orderApi.post('/', orderData);
      console.log('Order created successfully:', response);
      return response;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw new Error('Failed to submit order. Please check your information and try again.');
    }
  },

  // Get order by ID
  getOrder: async (orderId) => {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      return await orderApi.get(`/${orderId}`);
    } catch (error) {
      console.error(`Failed to fetch order ${orderId}:`, error);
      throw new Error('Order not found. Please check your order ID and try again.');
    }
  },

  // Get orders by user ID
  getUserOrders: async (userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return await orderApi.get(`/user/${userId}`);
    } catch (error) {
      console.error(`Failed to fetch orders for user ${userId}:`, error);
      throw new Error('Unable to load user orders.');
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    try {
      if (!orderId || !status) {
        throw new Error('Order ID and status are required');
      }
      
      return await orderApi.put(`/${orderId}/status`, { status });
    } catch (error) {
      console.error(`Failed to update order ${orderId} status:`, error);
      throw new Error('Failed to update order status.');
    }
  }
};

// Utility functions
export const apiUtils = {
  // Check API health
  checkHealth: async () => {
    try {
      const healthChecks = await Promise.allSettled([
        menuApi.get('/health').catch(() => ({ status: 'down', service: 'menu' })),
        orderApi.get('/health').catch(() => ({ status: 'down', service: 'order' }))
      ]);

      return {
        menu: healthChecks[0].status === 'fulfilled' ? 'up' : 'down',
        order: healthChecks[1].status === 'fulfilled' ? 'up' : 'down',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        menu: 'down',
        order: 'down',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  // Format errors for display
  formatError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    } else if (error.message) {
      return error.message;
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }
};

export default { menuAPI, orderAPI, apiUtils };
