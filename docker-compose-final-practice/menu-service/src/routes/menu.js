const express = require('express');
const axios = require('axios');
const redisService = require('../services/redisService');
const pizzaData = require('../data/pizzaData');
const { createLogger } = require('../utils/logger');

const router = express.Router();

const logger = createLogger('menu-routes');

const validationError = (res, message, details) => {
  const payload = {
    error: message,
    timestamp: new Date().toISOString()
  };

  if (details) {
    payload.details = details;
  }

  return res.status(400).json(payload);
};

// GET /api/menu - Get all pizzas
router.get('/', async (req, res) => {
  try {
    logger.info('Fetching complete galactic menu');
    
    // Try to get from cache first
    const cachedMenu = await redisService.get('galactic:menu:all');
    if (cachedMenu) {
      logger.info('Menu retrieved from cache');
      return res.json(JSON.parse(cachedMenu));
    }

    // Get fresh data
    const menu = pizzaData.getAllPizzas();
    
    // Cache for 5 minutes
    await redisService.setex('galactic:menu:all', 300, JSON.stringify(menu));
    
    logger.info(`Menu retrieved: ${menu.length} pizzas available`);
    res.json(menu);

  } catch (error) {
    logger.error('Error fetching menu:', error);
    res.status(500).json({
      error: 'Failed to retrieve galactic menu',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/menu/popular - Get popular pizzas from cache
router.get('/popular', async (req, res) => {
  try {
    logger.info('Fetching popular pizzas');

    // Get popular pizza IDs from cache
    const popularIds = await redisService.get('galactic:popular:ids');
    
    if (!popularIds) {
      logger.info('No popular pizzas in cache, using defaults');
      // Default popular pizzas if cache is empty
      const defaultPopular = pizzaData.getAllPizzas().slice(0, 3);
      return res.json(defaultPopular);
    }

    const ids = JSON.parse(popularIds);
    const popularPizzas = pizzaData.getPizzasByIds(ids);
    
    logger.info(`Found ${popularPizzas.length} popular pizzas`);
    res.json(popularPizzas);

  } catch (error) {
    logger.error('Error fetching popular pizzas:', error);
    res.status(500).json({
      error: 'Failed to retrieve popular pizzas',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/menu/:id - Get specific pizza
router.get('/:id', async (req, res) => {
  try {
    const pizzaId = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(pizzaId) || pizzaId < 1) {
      return validationError(res, 'Pizza ID must be a positive integer');
    }
    logger.info(`Fetching pizza with ID: ${pizzaId}`);

    // Try cache first
    const cacheKey = `galactic:pizza:${pizzaId}`;
    const cachedPizza = await redisService.get(cacheKey);
    
    if (cachedPizza) {
      logger.info(`Pizza ${pizzaId} retrieved from cache`);
      return res.json(JSON.parse(cachedPizza));
    }

    // Get from data source
    const pizza = pizzaData.getPizzaById(pizzaId);
    
    if (!pizza) {
      return res.status(404).json({
        error: 'Pizza not found in our galactic menu',
        pizzaId: pizzaId,
        timestamp: new Date().toISOString()
      });
    }

    // Cache for 10 minutes
    await redisService.setex(cacheKey, 600, JSON.stringify(pizza));
    
    logger.info(`Pizza ${pizzaId} retrieved successfully`);
    res.json(pizza);

  } catch (error) {
    logger.error(`Error fetching pizza ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to retrieve pizza',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/menu/recommendations/:userId - Get recommendations for user
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId || !userId.trim()) {
      return validationError(res, 'User ID is required');
    }
    logger.info(`Fetching recommendations for user: ${userId}`);

    // Check cache first
    const cacheKey = `galactic:recommendations:${userId}`;
    const cachedRecs = await redisService.get(cacheKey);
    
    if (cachedRecs) {
      logger.info(`Recommendations for ${userId} retrieved from cache`);
      return res.json(JSON.parse(cachedRecs));
    }

    let recommendations = [];

    try {
      // Try to get user order history from Order Service
      const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:8001';
      logger.info(`Requesting order history from: ${orderServiceUrl}/api/orders/user/${userId}`);
      
      const response = await axios.get(`${orderServiceUrl}/api/orders/user/${userId}`, {
        timeout: 5000
      });

      const userOrders = response.data;
      
      if (userOrders && userOrders.length > 0) {
        // Extract pizza IDs from user's order history
        const orderedPizzaIds = new Set();
        userOrders.forEach(order => {
          if (order.items) {
            order.items.forEach(item => {
              orderedPizzaIds.add(item.pizzaId);
            });
          }
        });

        // Get different pizzas from same galaxies
        const orderedPizzas = pizzaData.getPizzasByIds([...orderedPizzaIds]);
        const preferredGalaxies = [...new Set(orderedPizzas.map(p => p.galaxy))];
        
        recommendations = pizzaData.getAllPizzas()
          .filter(pizza => 
            preferredGalaxies.includes(pizza.galaxy) && 
            !orderedPizzaIds.has(pizza.id)
          )
          .slice(0, 4);

        logger.info(`Generated ${recommendations.length} recommendations based on order history`);
      }
    } catch (orderServiceError) {
      logger.warn('Could not fetch order history:', orderServiceError.message);
    }

    // Fallback to popular pizzas if no order history
    if (recommendations.length === 0) {
      recommendations = pizzaData.getAllPizzas()
        .sort(() => Math.random() - 0.5) // Random shuffle
        .slice(0, 3);
      
      logger.info(`Using fallback recommendations: ${recommendations.length} pizzas`);
    }

    // Cache recommendations for 1 hour
    await redisService.setex(cacheKey, 3600, JSON.stringify(recommendations));

    res.json(recommendations);

  } catch (error) {
    logger.error(`Error generating recommendations for ${req.params.userId}:`, error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/menu/popular - Update popular pizzas (internal endpoint)
router.post('/popular', async (req, res) => {
  try {
    const { pizzaIds } = req.body;
    if (!Array.isArray(pizzaIds) || pizzaIds.length === 0) {
      return validationError(res, 'Pizza IDs must be a non-empty array');
    }

    const invalidIds = pizzaIds.filter(id => {
      const numericId = Number.parseInt(id, 10);
      return !Number.isInteger(numericId) || numericId < 1;
    });

    if (invalidIds.length > 0) {
      return validationError(res, 'Each pizza ID must be a positive integer', { invalidIds });
    }
    const numericPizzaIds = pizzaIds.map(id => Number.parseInt(id, 10));
    logger.info(`Updating popular pizzas: ${numericPizzaIds.join(', ')}`);

    // Validate that all pizza IDs exist
    const validPizzas = pizzaData.getPizzasByIds(numericPizzaIds);
    if (validPizzas.length !== numericPizzaIds.length) {
      return res.status(400).json({
        error: 'Some pizza IDs are invalid',
        timestamp: new Date().toISOString()
      });
    }

    // Update popular list in cache
    await redisService.setex('galactic:popular:ids', 3600, JSON.stringify(numericPizzaIds));
    
    logger.info('Popular pizzas updated successfully');
    res.json({
      message: 'Popular pizzas updated',
      pizzaIds: numericPizzaIds,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error updating popular pizzas:', error);
    res.status(500).json({
      error: 'Failed to update popular pizzas',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/menu/galaxy/:galaxy - Get pizzas by galaxy
router.get('/galaxy/:galaxy', async (req, res) => {
  try {
    const galaxy = req.params.galaxy;
    if (!galaxy || !galaxy.trim()) {
      return validationError(res, 'Galaxy name is required');
    }
    logger.info(`Fetching pizzas from galaxy: ${galaxy}`);

    const cacheKey = `galactic:menu:galaxy:${galaxy}`;
    const cachedPizzas = await redisService.get(cacheKey);
    
    if (cachedPizzas) {
      logger.info(`Galaxy ${galaxy} pizzas retrieved from cache`);
      return res.json(JSON.parse(cachedPizzas));
    }

    const pizzas = pizzaData.getAllPizzas().filter(pizza => 
      pizza.galaxy.toLowerCase().includes(galaxy.toLowerCase())
    );

    // Cache for 15 minutes
    await redisService.setex(cacheKey, 900, JSON.stringify(pizzas));
    
    logger.info(`Found ${pizzas.length} pizzas in galaxy ${galaxy}`);
    res.json(pizzas);

  } catch (error) {
    logger.error(`Error fetching pizzas from galaxy ${req.params.galaxy}:`, error);
    res.status(500).json({
      error: 'Failed to retrieve pizzas from galaxy',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
