package com.canteen.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class EventDTO {
    private Long id;
    private LocalDate eventDate;
    private String eventType;
    private String description;
    private Double impactFactor;
}
