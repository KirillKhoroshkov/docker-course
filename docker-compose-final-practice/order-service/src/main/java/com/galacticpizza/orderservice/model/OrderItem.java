package com.galacticpizza.orderservice.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.io.Serializable;

/**
 * Order Item Entity
 * 
 * Represents an individual pizza item within an order, including
 * quantity, pricing, and customization details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderItem implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Pizza ID from the menu service
     */
    @NotNull(message = "Pizza ID is required")
    @Positive(message = "Pizza ID must be positive")
    @JsonProperty("pizzaId")
    private Integer pizzaId;

    /**
     * Pizza name for display purposes
     */
    @JsonProperty("name")
    private String name;

    /**
     * Quantity of this pizza
     */
    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    @Max(value = 50, message = "Maximum 50 pizzas per item")
    @JsonProperty("quantity")
    private Integer quantity;

    /**
     * Price per pizza (in galactic credits)
     */
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", message = "Price cannot be negative")
    @JsonProperty("price")
    private Double price;

    /**
     * Galaxy of origin for the pizza
     */
    @JsonProperty("galaxy")
    private String galaxy;

    /**
     * Special customizations for this item
     */
    @Size(max = 200, message = "Customizations cannot exceed 200 characters")
    @JsonProperty("customizations")
    private String customizations;

    /**
     * Size of the pizza
     */
    @JsonProperty("size")
    @Builder.Default
    private String size = "standard";

    /**
     * Crust type preference
     */
    @JsonProperty("crustType")
    @Builder.Default
    private String crustType = "traditional";

    /**
     * Spice level for the pizza
     */
    @JsonProperty("spiceLevel")
    @Min(value = 0, message = "Spice level cannot be negative")
    @Max(value = 5, message = "Maximum spice level is 5")
    @Builder.Default
    private Integer spiceLevel = 0;

    /**
     * Any dietary restrictions or preferences
     */
    @JsonProperty("dietaryNotes")
    private String dietaryNotes;

    /**
     * Whether this item is a gift
     */
    @JsonProperty("isGift")
    @Builder.Default
    private Boolean isGift = false;

    /**
     * Gift message if this is a gift
     */
    @Size(max = 100, message = "Gift message cannot exceed 100 characters")
    @JsonProperty("giftMessage")
    private String giftMessage;

    /**
     * Calculate total price for this item (price * quantity)
     */
    public Double getTotalPrice() {
        if (price == null || quantity == null) {
            return 0.0;
        }
        return price * quantity;
    }

    /**
     * Get item description for display
     */
    public String getItemDescription() {
        StringBuilder description = new StringBuilder();
        
        if (name != null && !name.isEmpty()) {
            description.append(name);
        } else {
            description.append("Pizza #").append(pizzaId);
        }
        
        if (size != null && !size.equals("standard")) {
            description.append(" (").append(size).append(")");
        }
        
        if (quantity != null && quantity > 1) {
            description.append(" x").append(quantity);
        }
        
        return description.toString();
    }

    /**
     * Check if item has customizations
     */
    public boolean hasCustomizations() {
        return (customizations != null && !customizations.trim().isEmpty()) ||
               (crustType != null && !crustType.equals("traditional")) ||
               (spiceLevel != null && spiceLevel > 0) ||
               (dietaryNotes != null && !dietaryNotes.trim().isEmpty());
    }

    /**
     * Get customization summary
     */
    public String getCustomizationSummary() {
        if (!hasCustomizations()) {
            return "Standard preparation";
        }
        
        StringBuilder summary = new StringBuilder();
        
        if (crustType != null && !crustType.equals("traditional")) {
            summary.append(crustType).append(" crust");
        }
        
        if (spiceLevel != null && spiceLevel > 0) {
            if (summary.length() > 0) summary.append(", ");
            summary.append("Spice level ").append(spiceLevel);
        }
        
        if (customizations != null && !customizations.trim().isEmpty()) {
            if (summary.length() > 0) summary.append(", ");
            summary.append(customizations);
        }
        
        if (dietaryNotes != null && !dietaryNotes.trim().isEmpty()) {
            if (summary.length() > 0) summary.append(", ");
            summary.append(dietaryNotes);
        }
        
        return summary.toString();
    }

    /**
     * Check if this is a valid order item
     */
    public boolean isValid() {
        return pizzaId != null && pizzaId > 0 &&
               quantity != null && quantity > 0 &&
               price != null && price >= 0;
    }

    /**
     * Get price display string
     */
    public String getPriceDisplay() {
        if (price == null) {
            return "₵0";
        }
        return String.format("₵%.0f", price);
    }

    /**
     * Get total price display string
     */
    public String getTotalPriceDisplay() {
        Double total = getTotalPrice();
        return String.format("₵%.0f", total);
    }
}
