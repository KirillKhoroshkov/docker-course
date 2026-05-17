package com.galacticpizza.orderservice.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

/**
 * Galactic Pizza Order Entity
 * 
 * Represents a complete pizza order with all necessary information for
 * intergalactic delivery and order management.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class Order implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Unique order identifier (generated automatically)
     */
    @JsonProperty("id")
    private String id;

    /**
     * User who placed the order
     */
    @NotBlank(message = "User ID is required for intergalactic tracking")
    @JsonProperty("userId")
    private String userId;

    /**
     * List of pizza items in the order
     */
    @NotEmpty(message = "Order must contain at least one galactic pizza")
    @Valid
    @JsonProperty("items")
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    /**
     * Delivery address information
     */
    @NotNull(message = "Delivery address is required for hyperspace navigation")
    @Valid
    @JsonProperty("deliveryAddress")
    private DeliveryAddress deliveryAddress;

    /**
     * Contact information for the customer
     */
    @Valid
    @JsonProperty("contactInfo")
    private ContactInfo contactInfo;

    /**
     * Current order status
     * Possible values: pending, preparing, ready, in_transit, delivered, cancelled
     */
    @JsonProperty("status")
    @Builder.Default
    private String status = "pending";

    /**
     * Total amount for the order (in galactic credits)
     */
    @DecimalMin(value = "0.0", message = "Total amount cannot be negative")
    @JsonProperty("totalAmount")
    private Double totalAmount;

    /**
     * Delivery fee (in galactic credits)
     */
    @DecimalMin(value = "0.0", message = "Delivery fee cannot be negative")
    @JsonProperty("deliveryFee")
    private Double deliveryFee;

    /**
     * Subtotal before delivery fee (in galactic credits)
     */
    @DecimalMin(value = "0.0", message = "Subtotal cannot be negative")
    @JsonProperty("subtotal")
    private Double subtotal;

    /**
     * Estimated delivery time
     */
    @JsonProperty("estimatedDelivery")
    private String estimatedDelivery;

    /**
     * Special instructions for the order
     */
    @Size(max = 500, message = "Special instructions cannot exceed 500 characters")
    @JsonProperty("specialInstructions")
    private String specialInstructions;

    /**
     * Order creation timestamp
     */
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    /**
     * Last update timestamp
     */
    @JsonProperty("updatedAt")
    private LocalDateTime updatedAt;

    /**
     * Order completion timestamp
     */
    @JsonProperty("completedAt")
    private LocalDateTime completedAt;

    /**
     * Payment information
     */
    @JsonProperty("paymentMethod")
    private String paymentMethod;

    /**
     * Payment status
     */
    @JsonProperty("paymentStatus")
    @Builder.Default
    private String paymentStatus = "pending";

    /**
     * Delivery tracking information
     */
    @JsonProperty("trackingInfo")
    private String trackingInfo;

    /**
     * Priority level for delivery
     */
    @JsonProperty("priority")
    @Builder.Default
    private String priority = "standard";

    /**
     * Galaxy-specific delivery notes
     */
    @JsonProperty("deliveryNotes")
    private String deliveryNotes;

    /**
     * Pre-persist method to set creation timestamp
     */
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
        
        // Generate order ID if not set
        if (id == null || id.isEmpty()) {
            id = generateOrderId();
        }
        
        // Set default estimated delivery if not provided
        if (estimatedDelivery == null || estimatedDelivery.isEmpty()) {
            estimatedDelivery = calculateEstimatedDelivery();
        }
        
        // Calculate totals if not set
        if (totalAmount == null || totalAmount == 0.0) {
            calculateTotals();
        }
        
        // Set default tracking info
        if (trackingInfo == null || trackingInfo.isEmpty()) {
            trackingInfo = "Order received and queued for preparation";
        }
    }

    /**
     * Pre-update method to update timestamp
     */
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
        
        // Update completion timestamp if order is delivered
        if ("delivered".equalsIgnoreCase(status) && completedAt == null) {
            completedAt = LocalDateTime.now();
        }
    }

    /**
     * Generate unique order ID
     */
    private String generateOrderId() {
        long timestamp = System.currentTimeMillis();
        int random = (int) (Math.random() * 9000) + 1000;
        return "ORDER_" + timestamp + "_" + random;
    }

    /**
     * Calculate estimated delivery time based on galaxy
     */
    private String calculateEstimatedDelivery() {
        if (deliveryAddress == null || deliveryAddress.getGalaxy() == null) {
            return "30-45 parsecs";
        }
        
        return switch (deliveryAddress.getGalaxy()) {
            case "Milky Way" -> "25-35 parsecs";
            case "Andromeda" -> "45-60 parsecs";
            case "Triangulum" -> "50-70 parsecs";
            case "Large Magellanic Cloud" -> "35-45 parsecs";
            case "Small Magellanic Cloud" -> "40-50 parsecs";
            case "Whirlpool" -> "55-75 parsecs";
            case "Sombrero" -> "60-80 parsecs";
            case "Pinwheel" -> "50-65 parsecs";
            default -> "30-60 parsecs";
        };
    }

    /**
     * Calculate order totals
     */
    private void calculateTotals() {
        if (items == null || items.isEmpty()) {
            subtotal = 0.0;
            totalAmount = 0.0;
            return;
        }
        
        // Calculate subtotal
        subtotal = items.stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();
        
        // Calculate delivery fee based on galaxy
        deliveryFee = calculateDeliveryFee();
        
        // Calculate total
        totalAmount = subtotal + deliveryFee;
    }

    /**
     * Calculate delivery fee based on destination galaxy
     */
    private Double calculateDeliveryFee() {
        if (deliveryAddress == null || deliveryAddress.getGalaxy() == null) {
            return 100.0; // Default fee
        }
        
        return switch (deliveryAddress.getGalaxy()) {
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

    /**
     * Check if order can be cancelled
     */
    public boolean isCancellable() {
        return "pending".equalsIgnoreCase(status) || "preparing".equalsIgnoreCase(status);
    }

    /**
     * Check if order is completed
     */
    public boolean isCompleted() {
        return "delivered".equalsIgnoreCase(status) || "cancelled".equalsIgnoreCase(status);
    }

    /**
     * Get order summary for display
     */
    public String getOrderSummary() {
        if (items == null || items.isEmpty()) {
            return "Empty order";
        }
        
        int totalItems = items.stream().mapToInt(OrderItem::getQuantity).sum();
        return String.format("%d item(s) - %,.0f ₵", totalItems, totalAmount);
    }

    /**
     * Get delivery location summary
     */
    public String getDeliveryLocationSummary() {
        if (deliveryAddress == null) {
            return "Unknown location";
        }
        
        return String.format("%s, Sector %s, Station %s", 
                deliveryAddress.getGalaxy(),
                deliveryAddress.getSector(),
                deliveryAddress.getStation());
    }
}
