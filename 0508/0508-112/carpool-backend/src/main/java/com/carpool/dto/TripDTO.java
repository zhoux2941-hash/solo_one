package com.carpool.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class TripDTO {

    @Data
    public static class CreateTripRequest {
        @NotBlank(message = "出发城市不能为空")
        private String departureCity;

        @NotBlank(message = "目的城市不能为空")
        private String destinationCity;

        private String waypoints;

        @NotNull(message = "出发时间不能为空")
        @Future(message = "出发时间必须在未来")
        private LocalDateTime departureTime;

        @NotNull(message = "总座位数不能为空")
        @Min(value = 1, message = "总座位数至少为1")
        @Max(value = 10, message = "总座位数最多为10")
        private Integer totalSeats;

        @NotNull(message = "人均费用不能为空")
        @DecimalMin(value = "0.00", message = "人均费用不能为负")
        @DecimalMax(value = "10000.00", message = "人均费用过高")
        private BigDecimal costPerPerson;

        @Size(max = 500, message = "描述不能超过500字符")
        private String description;
    }

    @Data
    public static class SearchTripRequest {
        @NotBlank(message = "目的城市不能为空")
        private String destinationCity;

        @NotNull(message = "出发时间不能为空")
        private LocalDateTime departureTime;
    }

    @Data
    public static class TripResponse {
        private Long id;
        private Long publisherId;
        private String publisherName;
        private Integer publisherCreditScore;
        private String departureCity;
        private String destinationCity;
        private String waypoints;
        private List<String> waypointList;
        private String matchType;
        private LocalDateTime departureTime;
        private Integer totalSeats;
        private Integer availableSeats;
        private BigDecimal costPerPerson;
        private String description;
        private String status;
        private LocalDateTime createdAt;
    }

    @Data
    public static class HotCityTrip {
        private String city;
        private Long tripCount;
        private java.util.List<TripResponse> trips;
    }
}
