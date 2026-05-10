package com.blindbox.exchange.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BlindBoxRequest {
    @NotBlank
    @Size(max = 100)
    private String modelNumber;

    @NotBlank
    @Size(max = 100)
    private String seriesName;

    @NotBlank
    @Size(max = 100)
    private String styleName;

    @Size(max = 500)
    private String imageUrl;

    @NotBlank
    @Size(max = 20)
    private String condition;

    @Size(max = 500)
    private String description;
}
