package com.antifraud.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginEvent {
    private String accountId;
    private String ipAddress;
    private long timestamp;
    private String deviceId;
    private String location;
    private boolean success;
}
