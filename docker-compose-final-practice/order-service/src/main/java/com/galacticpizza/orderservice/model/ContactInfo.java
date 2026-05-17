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
 * Contact Information Entity
 * 
 * Stores customer contact details for order communication
 * and delivery coordination across the galaxy.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class ContactInfo implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Customer's name or designation
     */
    @NotBlank(message = "Contact name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @JsonProperty("name")
    private String name;

    /**
     * Primary communication channel (email, subspace, etc.)
     */
    @NotBlank(message = "Communication method is required")
    @Size(max = 150, message = "Communication method cannot exceed 150 characters")
    @JsonProperty("communication")
    private String communication;

    /**
     * Secondary contact method (optional)
     */
    @Size(max = 150, message = "Secondary communication cannot exceed 150 characters")
    @JsonProperty("secondaryCommunication")
    private String secondaryCommunication;

    /**
     * Preferred communication protocol
     */
    @JsonProperty("preferredProtocol")
    @Builder.Default
    private String preferredProtocol = "subspace";

    /**
     * Emergency contact information
     */
    @Size(max = 150, message = "Emergency contact cannot exceed 150 characters")
    @JsonProperty("emergencyContact")
    private String emergencyContact;

    /**
     * Customer title or rank (if applicable)
     */
    @Size(max = 50, message = "Title cannot exceed 50 characters")
    @JsonProperty("title")
    private String title;

    /**
     * Organization or ship affiliation
     */
    @Size(max = 100, message = "Organization cannot exceed 100 characters")
    @JsonProperty("organization")
    private String organization;

    /**
     * Language preference for communications
     */
    @JsonProperty("language")
    @Builder.Default
    private String language = "Galactic Standard";

    /**
     * Time zone preference for delivery scheduling
     */
    @JsonProperty("timeZone")
    private String timeZone;

    /**
     * Special communication notes
     */
    @Size(max = 200, message = "Communication notes cannot exceed 200 characters")
    @JsonProperty("communicationNotes")
    private String communicationNotes;

    /**
     * Get formatted full name with title
     */
    public String getFormattedName() {
        StringBuilder formatted = new StringBuilder();
        
        if (title != null && !title.trim().isEmpty()) {
            formatted.append(title).append(" ");
        }
        
        formatted.append(name);
        
        if (organization != null && !organization.trim().isEmpty()) {
            formatted.append(" (").append(organization).append(")");
        }
        
        return formatted.toString();
    }

    /**
     * Get primary contact display
     */
    public String getPrimaryContact() {
        return communication;
    }

    /**
     * Check if customer has backup communication method
     */
    public boolean hasSecondaryContact() {
        return secondaryCommunication != null && !secondaryCommunication.trim().isEmpty();
    }

    /**
     * Check if customer has emergency contact
     */
    public boolean hasEmergencyContact() {
        return emergencyContact != null && !emergencyContact.trim().isEmpty();
    }

    /**
     * Get contact method type (email, subspace, quantum, etc.)
     */
    public String getContactType() {
        if (communication == null) {
            return "unknown";
        }
        
        String comm = communication.toLowerCase();
        if (comm.contains("@")) {
            if (comm.contains("subspace")) {
                return "subspace";
            } else if (comm.contains("quantum")) {
                return "quantum";
            } else if (comm.contains("neural")) {
                return "neural";
            } else {
                return "email";
            }
        } else if (comm.contains("freq") || comm.contains("hz")) {
            return "radio";
        } else if (comm.contains("channel")) {
            return "channel";
        } else {
            return "other";
        }
    }

    /**
     * Validate communication format based on type
     */
    public boolean isValidCommunication() {
        if (communication == null || communication.trim().isEmpty()) {
            return false;
        }
        
        String contactType = getContactType();
        String comm = communication.trim();
        
        return switch (contactType) {
            case "email", "subspace", "quantum", "neural" -> 
                comm.contains("@") && comm.contains(".");
            case "radio" -> 
                comm.matches(".*\\d+\\.?\\d*.*[hH][zZ].*");
            case "channel" -> 
                comm.matches(".*[cC]hannel.*\\d+.*");
            default -> 
                comm.length() >= 5; // Minimum length check for other types
        };
    }

    /**
     * Get contact summary for display
     */
    public String getContactSummary() {
        StringBuilder summary = new StringBuilder();
        summary.append(getFormattedName());
        
        if (communication != null) {
            summary.append(" - ").append(communication);
        }
        
        if (hasSecondaryContact()) {
            summary.append(" (Alt: ").append(secondaryCommunication).append(")");
        }
        
        return summary.toString();
    }

    /**
     * Check if contact info is complete and valid
     */
    public boolean isComplete() {
        return name != null && !name.trim().isEmpty() &&
               communication != null && !communication.trim().isEmpty() &&
               isValidCommunication();
    }

    /**
     * Get communication protocol icon/symbol
     */
    public String getProtocolIcon() {
        return switch (getContactType()) {
            case "email" -> "📧";
            case "subspace" -> "📡";
            case "quantum" -> "🔬";
            case "neural" -> "🧠";
            case "radio" -> "📻";
            case "channel" -> "📺";
            default -> "📞";
        };
    }
}
