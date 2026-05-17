package com.galacticpizza.orderservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.galacticpizza.orderservice.model.Order;
import com.galacticpizza.orderservice.model.OrderItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Galactic Pizza Order Service
 * 
 * Handles all order-related business logic including creation, validation,
 * status management, caching, and inter-service communication.
 */
@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    // Redis key prefixes
    private static final String ORDER_KEY_PREFIX = "galactic:order:";
    private static final String USER_ORDERS_PREFIX = "galactic:user:orders:";
    private static final String ORDER_STATS_KEY = "galactic:order:stats";
    private static final String ORDER_COUNTER_KEY = "galactic:order:counter";
    
    // Cache expiration times
    private static final long ORDER_CACHE_TTL = 24; // 24 hours
    private static final long STATS_CACHE_TTL = 1; // 1 hour
    private static final long USER_ORDERS_CACHE_TTL = 2; // 2 hours

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private WebClient webClient;

    private final ObjectMapper objectMapper;

    @Value("${app.menu-service.url:http://menu-service:8000}")
    private String menuServiceUrl;

    public OrderService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    /**
     * Create a new galactic pizza order
     */
    public Order createOrder(Order order) {
        try {
            logger.info("🍕 Creating new order for user: {}", order.getUserId());

            // Validate order
            validateOrder(order);

            // Pre-process order
            order.prePersist();

            // Validate pizza items with Menu Service
            validatePizzaItems(order.getItems());

            // Calculate delivery fee and totals
            calculateOrderTotals(order);

            // Generate unique order ID if not present
            if (order.getId() == null || order.getId().isEmpty()) {
                order.setId(generateUniqueOrderId());
            }

            // Set initial status and tracking info
            order.setStatus("pending");
            order.setTrackingInfo("Order received and queued for galactic kitchen preparation");
            order.setPaymentStatus("pending");
            
            // Save order to cache
            saveOrderToCache(order);

            // Update user orders list
            addOrderToUserList(order.getUserId(), order.getId());

            // Update order statistics
            updateOrderStatistics(order);

            logger.info("✅ Order created successfully: {}", order.getId());
            return order;

        } catch (Exception e) {
            logger.error("💥 Failed to create order: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create galactic order: " + e.getMessage(), e);
        }
    }

    /**
     * Get order by ID
     */
    public Order getOrderById(String orderId) {
        try {
            logger.info("📡 Retrieving order: {}", orderId);

            // Try to get from cache first
            Order order = getOrderFromCache(orderId);
            
            if (order != null) {
                logger.info("✅ Order found in cache: {}", orderId);
                return order;
            }

            logger.warn("🔍 Order not found: {}", orderId);
            return null;

        } catch (Exception e) {
            logger.error("💥 Failed to retrieve order {}: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve order: " + e.getMessage(), e);
        }
    }

    /**
     * Get all orders for a specific user
     */
    public List<Order> getOrdersByUserId(String userId) {
        try {
            logger.info("👤 Retrieving orders for user: {}", userId);

            // Get user's order IDs from cache
            Set<String> orderIds = getUserOrderIds(userId);
            
            if (orderIds.isEmpty()) {
                logger.info("📭 No orders found for user: {}", userId);
                return new ArrayList<>();
            }

            // Retrieve orders
            List<Order> orders = new ArrayList<>();
            for (String orderId : orderIds) {
                Order order = getOrderFromCache(orderId);
                if (order != null) {
                    orders.add(order);
                }
            }

            // Sort by creation date (newest first)
            orders.sort((a, b) -> {
                if (a.getCreatedAt() == null || b.getCreatedAt() == null) {
                    return 0;
                }
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });

            logger.info("✅ Found {} orders for user {}", orders.size(), userId);
            return orders;

        } catch (Exception e) {
            logger.error("💥 Failed to retrieve orders for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve user orders: " + e.getMessage(), e);
        }
    }

    /**
     * Update order status
     */
    public Order updateOrderStatus(String orderId, String newStatus) {
        try {
            logger.info("🔄 Updating order {} status to: {}", orderId, newStatus);

            // Get existing order
            Order order = getOrderById(orderId);
            if (order == null) {
                logger.warn("🔍 Order not found for status update: {}", orderId);
                return null;
            }

            // Validate status transition
            if (!isValidStatusTransition(order.getStatus(), newStatus)) {
                throw new IllegalArgumentException("Invalid status transition from " + 
                        order.getStatus() + " to " + newStatus);
            }

            // Update order
            String oldStatus = order.getStatus();
            order.setStatus(newStatus);
            order.preUpdate();
            
            // Update tracking info based on status
            order.setTrackingInfo(generateTrackingInfo(newStatus));

            // Save updated order
            saveOrderToCache(order);

            // Update statistics
            updateStatusStatistics(oldStatus, newStatus);

            logger.info("✅ Order status updated: {} -> {}", orderId, newStatus);
            return order;

        } catch (Exception e) {
            logger.error("💥 Failed to update order status for {}: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Failed to update order status: " + e.getMessage(), e);
        }
    }

    /**
     * Get order statistics
     */
    public Map<String, Object> getOrderStatistics() {
        try {
            logger.info("📊 Retrieving order statistics");

            // Try to get from cache first
            Map<String, Object> stats = getStatsFromCache();
            if (stats != null) {
                return stats;
            }

            // Generate fresh statistics
            stats = generateOrderStatistics();
            
            // Cache the statistics
            cacheStatistics(stats);

            return stats;

        } catch (Exception e) {
            logger.error("💥 Failed to retrieve order statistics: {}", e.getMessage(), e);
            return Map.of(
                    "error", "Failed to retrieve statistics",
                    "timestamp", System.currentTimeMillis()
            );
        }
    }

    /**
     * Check service health
     */
    public boolean isServiceHealthy() {
        try {
            // Check Redis connection
            Boolean redisHealthy = redisTemplate.execute((org.springframework.data.redis.core.RedisCallback<Boolean>) connection -> {
                try {
                    connection.ping();
                    return true;
                } catch (Exception e) {
                    logger.error("Redis health check failed: {}", e.getMessage());
                    return false;
                }
            });

            // Check Menu Service connectivity
            boolean menuServiceHealthy = checkMenuServiceHealth();

            boolean isHealthy = Boolean.TRUE.equals(redisHealthy) && menuServiceHealthy;
            
            logger.info("🏥 Service health check: Redis={}, MenuService={}, Overall={}", 
                    redisHealthy, menuServiceHealthy, isHealthy);
            
            return isHealthy;

        } catch (Exception e) {
            logger.error("💥 Health check failed: {}", e.getMessage(), e);
            return false;
        }
    }

    // Private helper methods

    private void validateOrder(Order order) {
        if (order == null) {
            throw new IllegalArgumentException("Order cannot be null");
        }

        if (order.getUserId() == null || order.getUserId().trim().isEmpty()) {
            throw new IllegalArgumentException("User ID is required");
        }

        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one pizza");
        }

        if (order.getDeliveryAddress() == null || !order.getDeliveryAddress().isComplete()) {
            throw new IllegalArgumentException("Complete delivery address is required");
        }

        // Validate each order item
        for (OrderItem item : order.getItems()) {
            if (!item.isValid()) {
                throw new IllegalArgumentException("Invalid order item: " + item.getPizzaId());
            }
        }
    }

    private void validatePizzaItems(List<OrderItem> items) {
        try {
            logger.info("🔍 Validating {} pizza items with Menu Service", items.size());

            for (OrderItem item : items) {
                // Call Menu Service to validate pizza exists
                Mono<Map> response = webClient.get()
                        .uri(menuServiceUrl + "/api/menu/" + item.getPizzaId())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .timeout(Duration.ofSeconds(5))
                        .onErrorResume(throwable -> {
                            logger.warn("Failed to validate pizza {}: {}", 
                                    item.getPizzaId(), throwable.getMessage());
                            return Mono.empty();
                        });

                Map<String, Object> pizza = response.block();
                
                if (pizza != null) {
                    // Update item with pizza details
                    item.setName((String) pizza.get("name"));
                    item.setGalaxy((String) pizza.get("galaxy"));
                    
                    // Validate price
                    Double menuPrice = ((Number) pizza.get("price")).doubleValue();
                    if (item.getPrice() == null || !item.getPrice().equals(menuPrice)) {
                        logger.info("Updating item price: {} -> {}", item.getPrice(), menuPrice);
                        item.setPrice(menuPrice);
                    }
                }
            }

            logger.info("✅ Pizza items validation completed");

        } catch (Exception e) {
            logger.warn("⚠️ Pizza validation failed, proceeding with order: {}", e.getMessage());
            // Don't fail the order if menu service is unavailable
        }
    }

    private void calculateOrderTotals(Order order) {
        // Calculate subtotal
        double subtotal = order.getItems().stream()
                .mapToDouble(OrderItem::getTotalPrice)
                .sum();

        // Calculate delivery fee
        double deliveryFee = calculateDeliveryFee(order.getDeliveryAddress().getGalaxy());

        // Set totals
        order.setSubtotal(subtotal);
        order.setDeliveryFee(deliveryFee);
        order.setTotalAmount(subtotal + deliveryFee);
    }

    private double calculateDeliveryFee(String galaxy) {
        return switch (galaxy) {
            case "Milky Way" -> 50.0;
            case "Andromeda" -> 150.0;
            case "Triangulum" -> 200.0;
            case "Large Magellanic Cloud" -> 100.0;
            case "Small Magellanic Cloud" -> 120.0;
            case "Whirlpool" -> 180.0;
            case "Sombrero" -> 220.0;
            case "Pinwheel" -> 160.0;
            default -> 100.0;
        };
    }

    private String generateUniqueOrderId() {
        // Increment counter and create unique ID
        Long counter = redisTemplate.opsForValue().increment(ORDER_COUNTER_KEY);
        long timestamp = System.currentTimeMillis();
        return String.format("ORDER_%d_%06d", timestamp, counter % 1000000);
    }

    private void saveOrderToCache(Order order) {
        try {
            String key = ORDER_KEY_PREFIX + order.getId();
            String orderJson = objectMapper.writeValueAsString(order);
            
            redisTemplate.opsForValue().set(key, orderJson, ORDER_CACHE_TTL, TimeUnit.HOURS);
            
            logger.debug("💾 Order cached: {}", order.getId());
        } catch (Exception e) {
            logger.error("Failed to cache order {}: {}", order.getId(), e.getMessage(), e);
        }
    }

    private Order getOrderFromCache(String orderId) {
        try {
            String key = ORDER_KEY_PREFIX + orderId;
            Object cached = redisTemplate.opsForValue().get(key);
            
            if (cached != null) {
                return objectMapper.readValue(cached.toString(), Order.class);
            }
        } catch (Exception e) {
            logger.error("Failed to retrieve order {} from cache: {}", orderId, e.getMessage(), e);
        }
        
        return null;
    }

    private void addOrderToUserList(String userId, String orderId) {
        try {
            String key = USER_ORDERS_PREFIX + userId;
            redisTemplate.opsForSet().add(key, orderId);
            redisTemplate.expire(key, USER_ORDERS_CACHE_TTL, TimeUnit.HOURS);
            
            logger.debug("📝 Added order {} to user {} list", orderId, userId);
        } catch (Exception e) {
            logger.error("Failed to add order to user list: {}", e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private Set<String> getUserOrderIds(String userId) {
        try {
            String key = USER_ORDERS_PREFIX + userId;
            Set<Object> orderIds = redisTemplate.opsForSet().members(key);
            
            if (orderIds != null) {
                return orderIds.stream()
                        .map(Object::toString)
                        .collect(Collectors.toSet());
            }
        } catch (Exception e) {
            logger.error("Failed to get user order IDs: {}", e.getMessage(), e);
        }
        
        return new HashSet<>();
    }

    private void updateOrderStatistics(Order order) {
        try {
            // Update various statistics
            String today = LocalDateTime.now().toLocalDate().toString();
            
            // Increment total orders
            redisTemplate.opsForHash().increment(ORDER_STATS_KEY, "total_orders", 1);
            
            // Increment orders by galaxy
            redisTemplate.opsForHash().increment(ORDER_STATS_KEY, 
                    "galaxy_" + order.getDeliveryAddress().getGalaxy().replaceAll("\\s+", "_"), 1);
            
            // Update revenue
            redisTemplate.opsForHash().increment(ORDER_STATS_KEY, "total_revenue", 
                    order.getTotalAmount().longValue());
            
            // Update today's stats
            redisTemplate.opsForHash().increment(ORDER_STATS_KEY, "orders_today_" + today, 1);
            
            logger.debug("📈 Updated order statistics for order: {}", order.getId());
            
        } catch (Exception e) {
            logger.error("Failed to update order statistics: {}", e.getMessage(), e);
        }
    }

    private boolean isValidStatusTransition(String currentStatus, String newStatus) {
        if (currentStatus == null || newStatus == null) {
            return false;
        }
        
        // Define valid status transitions
        Map<String, List<String>> validTransitions = Map.of(
            "pending", List.of("preparing", "cancelled"),
            "preparing", List.of("ready", "cancelled"),
            "ready", List.of("in_transit", "cancelled"),
            "in_transit", List.of("delivered"),
            "delivered", List.of(), // Terminal state
            "cancelled", List.of()  // Terminal state
        );
        
        return validTransitions.getOrDefault(currentStatus, List.of()).contains(newStatus);
    }

    private String generateTrackingInfo(String status) {
        return switch (status.toLowerCase()) {
            case "pending" -> "Order received and awaiting galactic kitchen preparation";
            case "preparing" -> "Our space chefs are preparing your cosmic pizza masterpiece";
            case "ready" -> "Pizza is ready for hyperspace launch to your coordinates";
            case "in_transit" -> "Your order is traveling through hyperspace - estimated arrival soon";
            case "delivered" -> "Pizza delivered successfully - enjoy your galactic meal!";
            case "cancelled" -> "Order has been cancelled - refund processed";
            default -> "Order status updated: " + status;
        };
    }

    private void updateStatusStatistics(String oldStatus, String newStatus) {
        try {
            if (oldStatus != null) {
                redisTemplate.opsForHash().increment(ORDER_STATS_KEY, 
                        "status_" + oldStatus, -1);
            }
            
            redisTemplate.opsForHash().increment(ORDER_STATS_KEY, 
                    "status_" + newStatus, 1);
            
        } catch (Exception e) {
            logger.error("Failed to update status statistics: {}", e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getStatsFromCache() {
        try {
            Map<Object, Object> cached = redisTemplate.opsForHash().entries(ORDER_STATS_KEY);
            
            if (!cached.isEmpty()) {
                Map<String, Object> stats = new HashMap<>();
                cached.forEach((key, value) -> stats.put(key.toString(), value));
                stats.put("cached", true);
                stats.put("timestamp", System.currentTimeMillis());
                return stats;
            }
        } catch (Exception e) {
            logger.error("Failed to retrieve stats from cache: {}", e.getMessage(), e);
        }
        
        return null;
    }

    private Map<String, Object> generateOrderStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // Get cached statistics
            Map<Object, Object> cachedStats = redisTemplate.opsForHash().entries(ORDER_STATS_KEY);
            
            // Process and format statistics
            long totalOrders = getLongValue(cachedStats, "total_orders");
            long totalRevenue = getLongValue(cachedStats, "total_revenue");
            
            stats.put("totalOrders", totalOrders);
            stats.put("totalRevenue", totalRevenue);
            stats.put("averageOrderValue", totalOrders > 0 ? totalRevenue / totalOrders : 0);
            
            // Status breakdown
            Map<String, Long> statusStats = new HashMap<>();
            statusStats.put("pending", getLongValue(cachedStats, "status_pending"));
            statusStats.put("preparing", getLongValue(cachedStats, "status_preparing"));
            statusStats.put("ready", getLongValue(cachedStats, "status_ready"));
            statusStats.put("in_transit", getLongValue(cachedStats, "status_in_transit"));
            statusStats.put("delivered", getLongValue(cachedStats, "status_delivered"));
            statusStats.put("cancelled", getLongValue(cachedStats, "status_cancelled"));
            stats.put("statusBreakdown", statusStats);
            
            // Galaxy breakdown
            Map<String, Long> galaxyStats = new HashMap<>();
            galaxyStats.put("Milky Way", getLongValue(cachedStats, "galaxy_Milky_Way"));
            galaxyStats.put("Andromeda", getLongValue(cachedStats, "galaxy_Andromeda"));
            galaxyStats.put("Triangulum", getLongValue(cachedStats, "galaxy_Triangulum"));
            stats.put("galaxyBreakdown", galaxyStats);
            
            stats.put("generated", true);
            stats.put("timestamp", System.currentTimeMillis());
            
        } catch (Exception e) {
            logger.error("Failed to generate statistics: {}", e.getMessage(), e);
            stats.put("error", "Failed to generate statistics");
        }
        
        return stats;
    }

    private long getLongValue(Map<Object, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return 0;
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return 0;
    }

    private void cacheStatistics(Map<String, Object> stats) {
        try {
            String statsJson = objectMapper.writeValueAsString(stats);
            redisTemplate.opsForValue().set(ORDER_STATS_KEY + ":cached", statsJson, 
                    STATS_CACHE_TTL, TimeUnit.HOURS);
        } catch (Exception e) {
            logger.error("Failed to cache statistics: {}", e.getMessage(), e);
        }
    }

    private boolean checkMenuServiceHealth() {
        try {
            Mono<Map> response = webClient.get()
                    .uri(menuServiceUrl + "/health")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(3))
                    .onErrorReturn(Map.of("status", "DOWN"));
            
            Map<String, Object> health = response.block();
            return "healthy".equals(health.get("status"));
            
        } catch (Exception e) {
            logger.warn("Menu service health check failed: {}", e.getMessage());
            return false;
        }
    }
}
