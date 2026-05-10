package com.blindbox.exchange.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ExchangeRequestDTO {
    @NotNull
    private Long offerBoxId;

    @NotNull
    private Long requestBoxId;

    @Size(max = 500)
    private String message;
}
