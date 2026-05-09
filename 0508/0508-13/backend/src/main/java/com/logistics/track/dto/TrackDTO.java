package com.logistics.track.dto;

import com.logistics.track.entity.TrackStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TrackDTO {
    private Long trackId;
    private Long packageId;
    private String location;
    private TrackStatus status;
    private String statusDescription;
    private LocalDateTime timestamp;
    private Double latitude;
    private Double longitude;
    private String remark;
    private Long stayDurationHours;
}
