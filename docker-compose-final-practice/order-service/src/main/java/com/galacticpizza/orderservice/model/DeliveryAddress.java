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
 * Delivery Address Entity
 * 
 * Represents an intergalactic delivery address with galaxy,
 * sector, and station coordinates for precise hyperspace navigation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class DeliveryAddress implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Target galaxy for delivery
     */
    @NotBlank(message = "Galaxy is required for hyperspace navigation")
    @Size(max = 50, message = "Galaxy name cannot exceed 50 characters")
    @JsonProperty("galaxy")
    private String galaxy;

    /**
     * Sector within the galaxy
     */
    @NotBlank(message = "Sector is required for precise navigation")
    @Size(max = 30, message = "Sector name cannot exceed 30 characters")
    @JsonProperty("sector")
    private String sector;

    /**
     * Space station or planetary designation
     */
    @NotBlank(message = "Station is required for delivery completion")
    @Size(max = 100, message = "Station name cannot exceed 100 characters")
    @JsonProperty("station")
    private String station;

    /**
     * Docking bay or landing pad number
     */
    @Size(max = 20, message = "Docking bay cannot exceed 20 characters")
    @JsonProperty("dockingBay")
    private String dockingBay;

    /**
     * Building or habitat module
     */
    @Size(max = 50, message = "Building cannot exceed 50 characters")
    @JsonProperty("building")
    private String building;

    /**
     * Room or apartment number
     */
    @Size(max = 20, message = "Room number cannot exceed 20 characters")
    @JsonProperty("room")
    private String room;

    /**
     * Special delivery instructions
     */
    @Size(max = 200, message = "Delivery instructions cannot exceed 200 characters")
    @JsonProperty("deliveryInstructions")
    private String deliveryInstructions;

    /**
     * Security clearance level required (if any)
     */
    @JsonProperty("securityClearance")
    private String securityClearance;

    /**
     * Time zone of the delivery location
     */
    @JsonProperty("timeZone")
    private String timeZone;

    /**
     * Atmospheric conditions or special requirements
     */
    @Size(max = 100, message = "Atmospheric notes cannot exceed 100 characters")
    @JsonProperty("atmosphericNotes")
    private String atmosphericNotes;

    /**
     * Get formatted full address
     */
    public String getFullAddress() {
        StringBuilder address = new StringBuilder();
        
        // Add station
        if (station != null && !station.trim().isEmpty()) {
            address.append(station);
        }
        
        // Add building if present
        if (building != null && !building.trim().isEmpty()) {
            if (address.length() > 0) address.append(", ");
            address.append(building);
        }
        
        // Add room if present
        if (room != null && !room.trim().isEmpty()) {
            if (address.length() > 0) address.append(", ");
            address.append("Room ").append(room);
        }
        
        // Add docking bay if present
        if (dockingBay != null && !dockingBay.trim().isEmpty()) {
            if (address.length() > 0) address.append(", ");
            address.append("Bay ").append(dockingBay);
        }
        
        // Add sector and galaxy
        if (address.length() > 0) address.append(", ");
        address.append("Sector ").append(sector);
        address.append(", ").append(galaxy).append(" Galaxy");
        
        return address.toString();
    }

    /**
     * Get short address for display
     */
    public String getShortAddress() {
        return String.format("%s, %s, %s", station, sector, galaxy);
    }

    /**
     * Check if address has complete coordinates
     */
    public boolean isComplete() {
        return galaxy != null && !galaxy.trim().isEmpty() &&
               sector != null && !sector.trim().isEmpty() &&
               station != null && !station.trim().isEmpty();
    }

    /**
     * Check if this is a high-security location
     */
    public boolean isHighSecurity() {
        return securityClearance != null && !securityClearance.trim().isEmpty();
    }

    /**
     * Check if special atmospheric handling is required
     */
    public boolean requiresSpecialHandling() {
        return atmosphericNotes != null && !atmosphericNotes.trim().isEmpty();
    }

    /**
     * Get delivery complexity score (0-10)
     * Used to calculate delivery time and fees
     */
    public int getDeliveryComplexity() {
        int complexity = 0;
        
        // Base complexity by galaxy distance
        if (galaxy != null) {
            complexity += switch (galaxy) {
                case "Milky Way" -> 1;
                case "Large Magellanic Cloud" -> 3;
                case "Small Magellanic Cloud" -> 3;
                case "Andromeda" -> 5;
                case "Triangulum" -> 6;
                case "Whirlpool" -> 7;
                case "Sombrero" -> 8;
                case "Pinwheel" -> 7;
                default -> 4; // Unknown galaxy
            };
        }
        
        // Add complexity for special requirements
        if (isHighSecurity()) complexity += 2;
        if (requiresSpecialHandling()) complexity += 2;
        if (dockingBay != null && !dockingBay.trim().isEmpty()) complexity += 1;
        
        return Math.min(complexity, 10); // Cap at 10
    }

    /**
     * Validate galaxy name against known galaxies
     */
    public boolean isValidGalaxy() {
        if (galaxy == null) return false;
        
        String[] validGalaxies = {
            "Milky Way", "Andromeda", "Triangulum",
            "Large Magellanic Cloud", "Small Magellanic Cloud",
            "Whirlpool", "Sombrero", "Pinwheel"
        };
        
        for (String validGalaxy : validGalaxies) {
            if (validGalaxy.equalsIgnoreCase(galaxy)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get navigation coordinates as string
     */
    public String getNavigationCoordinates() {
        return String.format("GALAXY:%s|SECTOR:%s|STATION:%s", 
                galaxy, sector, station);
    }
}
