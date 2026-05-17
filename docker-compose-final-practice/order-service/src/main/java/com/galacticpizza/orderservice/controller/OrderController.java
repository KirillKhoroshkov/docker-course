package com.galacticpizza.orderservice.controller;

import com.galacticpizza.orderservice.model.Order;
import com.galacticpizza.orderservice.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Galactic Pizza Order Controller
 * 
 * RESTful API endpoints for managing intergalactic pizza orders.
 * Handles order creation, retrieval, status updates, and delivery tracking.
 */
@RestController
@RequestMapping("/api/orders")
@Validated
@CrossOrigin(origins = "*", maxAge = 3600)
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private OrderService orderService;

    /**
     * Create a new galactic pizza order
     * POST /api/orders
     */
    @PostMapping
    public ResponseEntity<?> createOrder(@Valid @RequestBody Order order) {
        try {
            logger.info("🍕 Receiving new order from galaxy: {}", 
                order.getDeliveryAddress() != null ? order.getDeliveryAddress().getGalaxy() : "Unknown");
            
            Order createdOrder = orderService.createOrder(order);
            
            logger.info("✅ Order created successfully with ID: {}", createdOrder.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", createdOrder.getId());
            response.put("status", createdOrder.getStatus());
            response.put("totalAmount", createdOrder.getTotalAmount());
            response.put("estimatedDelivery", createdOrder.getEstimatedDelivery());
            response.put("message", "Your galactic pizza order has been received and is being prepared!");
            response.put("trackingInfo", "Use order ID " + createdOrder.getId() + " to track your delivery through hyperspace");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (IllegalArgumentException e) {
            logger.warn("❌ Invalid order data: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Invalid order data",
                "message", e.getMessage(),
                "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            logger.error("💥 Failed to create order: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Order creation failed",
                "message", "Our galactic kitchen encountered an error. Please try again.",
                "timestamp", System.currentTimeMillis()
            ));
        }
    }

    /**
     * Get order by ID
     * GET /api/orders/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(@PathVariable @NotBlank String id) {
        try {
            logger.info("📡 Retrieving order: {}", id);
            
            Order order = orderService.getOrderById(id);
            
            if (order == null) {
                logger.warn("🔍 Order not found: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", "Order not found",
                    "message", "Order " + id + " does not exist in our galactic database",
                    "orderId", id,
                    "timestamp", System.currentTimeMillis()
                ));
            }
            
            logger.info("✅ Order retrieved successfully: {}", id);
            return ResponseEntity.ok(order);
            
        } catch (Exception e) {
            logger.error("💥 Failed to retrieve order {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to retrieve order",
                "message", "Unable to access galactic order database",
                "timestamp", System.currentTimeMillis()
            ));
        }
    }

    /**
     * Get all orders for a user
     * GET /api/orders/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserOrders(@PathVariable @NotBlank String userId) {
        try {
            logger.info("👤 Retrieving orders for user: {}", userId);
            
            List<Order> orders = orderService.getOrdersByUserId(userId);
            
            logger.info("✅ Found {} orders for user {}", orders.size(), userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("orderCount", orders.size());
            response.put("orders", orders);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("💥 Failed to retrieve user orders for {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to retrieve user orders",
                "message", "Unable to access galactic order history",
                "timestamp", System.currentTimeMillis()
            ));
        }
    }

    /**
     * Update order status
     * PUT /api/orders/{id}/status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable @NotBlank String id,
            @Valid @RequestBody Map<String, String> statusUpdate) {
        
        try {
            String newStatus = statusUpdate.get("status");
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid status",
                    "message", "Status field is required",
                    "timestamp", System.currentTimeMillis()
                ));
            }
            
            logger.info("🔄 Updating order {} status to: {}", id, newStatus);
            
            Order updatedOrder = orderService.updateOrderStatus(id, newStatus);
            
            if (updatedOrder == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", "Order not found",
                    "message", "Order " + id + " does not exist",
                    "timestamp", System.currentTimeMillis()
                ));
            }
            
            logger.info("✅ Order status updated successfully: {} -> {}", id, newStatus);
            
            Map<String, Object> response = new HashMap<>();
            response.put("orderId", id);
            response.put("oldStatus", statusUpdate.get("oldStatus"));
            response.put("newStatus", newStatus);
            response.put("updatedAt", updatedOrder.getUpdatedAt());
            response.put("message", getStatusUpdateMessage(newStatus));
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            logger.warn("❌ Invalid status update for order {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Invalid status update",
                "message", e.getMessage(),
                "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            logger.error("💥 Failed to update order status for {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Status update failed",
                "message", "Unable to update order status in galactic database",
                "timestamp", System.currentTimeMillis()
            ));
        }
    }

    /**
     * Get order statistics
     * GET /api/orders/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getOrderStats() {
        try {
            logger.info("📊 Retrieving order statistics");
            
            Map<String, Object> stats = orderService.getOrderStatistics();
            
            logger.info("✅ Order statistics retrieved successfully");
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            logger.error("💥 Failed to retrieve order statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to retrieve statistics",
                "message", "Unable to access galactic order analytics",
                "timestamp", System.currentTimeMillis()
            ));
        }
    }

    /**
     * Health check endpoint for the order controller
     * GET /api/orders/health
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        try {
            boolean isHealthy = orderService.isServiceHealthy();
            
            Map<String, Object> health = new HashMap<>();
            health.put("status", isHealthy ? "UP" : "DOWN");
            health.put("service", "order-controller");
            health.put("timestamp", System.currentTimeMillis());
            health.put("message", isHealthy ? "Order controller is operational" : "Order controller is experiencing issues");
            
            HttpStatus status = isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
            
            return ResponseEntity.status(status).body(health);
            
        } catch (Exception e) {
            logger.error("💥 Health check failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "status", "DOWN",
                "service", "order-controller", 
                "error", e.getMessage(),
                "timestamp", System.currentTimeMillis()
            ));
        }
    }

    /**
     * Get user-friendly status update message
     */
    private String getStatusUpdateMessage(String status) {
        return switch (status.toLowerCase()) {
            case "pending" -> "Your order has been received and is awaiting preparation";
            case "preparing" -> "Our galactic chefs are preparing your pizza in the space kitchen";
            case "ready" -> "Your order is ready for hyperspace launch!";
            case "in_transit" -> "Your pizza is traveling through hyperspace to your location";
            case "delivered" -> "Your galactic pizza has been delivered successfully!";
            case "cancelled" -> "Your order has been cancelled";
            default -> "Order status has been updated to: " + status;
        };
    }

    /**
     * Global exception handler for the controller
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGlobalException(Exception e) {
        logger.error("🚨 Unhandled exception in OrderController: {}", e.getMessage(), e);
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "error", "Internal server error",
            "message", "An unexpected error occurred in the galactic order system",
            "timestamp", System.currentTimeMillis(),
            "details", "Please contact galactic support if the issue persists"
        ));
    }
}
