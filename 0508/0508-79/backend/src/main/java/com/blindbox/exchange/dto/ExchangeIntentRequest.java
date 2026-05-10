package com.blindbox.exchange.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ExchangeIntentRequest {
    @NotNull
    private Long offerBoxId;

    @NotBlank
    @Size(max = 100)
    private String desiredSeries;

    @Size(max = 100)
    private String desiredStyle;

    @Size(max = 500)
    private String note;
}
