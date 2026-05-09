package com.logistics.track.dto;

import lombok.Data;

@Data
public class TrackSummaryDTO {
    private Long packageId;
    private String packageNo;
    private String senderCity;
    private String receiverCity;
    private String currentStatus;
    private String currentStatusDescription;
    
    private SummaryTrack pickup;
    private SummaryTrack latest;
    private SummaryTrack signed;
    
    private Double totalDistance;
    private Long totalHours;
    private Boolean isCompleted;

    @Data
    public static class SummaryTrack {
        private String location;
        private Double latitude;
        private Double longitude;
        private String timestamp;
        private String status;
    }
}
