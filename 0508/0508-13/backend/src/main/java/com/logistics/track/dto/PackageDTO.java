package com.logistics.track.dto;

import com.logistics.track.entity.TrackStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PackageDTO {
    private Long packageId;
    private String packageNo;
    private String sender;
    private String senderCity;
    private String receiver;
    private String receiverCity;
    private LocalDateTime createdAt;
    private TrackStatus currentStatus;
    private String currentStatusDescription;
}
