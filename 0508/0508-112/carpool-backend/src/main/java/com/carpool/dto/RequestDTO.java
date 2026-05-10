package com.carpool.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

public class RequestDTO {

    @Data
    public static class CreateRequest {
        @Min(value = 1, message = "至少申请1个座位")
        @Max(value = 5, message = "最多申请5个座位")
        private Integer seatsRequested = 1;

        @Size(max = 500, message = "留言不能超过500字符")
        private String message;
    }

    @Data
    public static class RequestResponse {
        private Long id;
        private Long tripId;
        private String departureCity;
        private String destinationCity;
        private LocalDateTime departureTime;
        private Long requesterId;
        private String requesterName;
        private Integer requesterCreditScore;
        private Integer seatsRequested;
        private String message;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime respondedAt;
    }

    @Data
    public static class RespondRequest {
        private String action;
    }
}
