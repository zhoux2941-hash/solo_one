package com.carpool.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

public class MessageDTO {

    @Data
    public static class SendMessage {
        @NotBlank(message = "消息内容不能为空")
        @Size(min = 1, max = 1000, message = "消息长度为1-1000字符")
        private String content;
    }

    @Data
    public static class MessageResponse {
        private Long id;
        private Long senderId;
        private String senderName;
        private String content;
        private LocalDateTime createdAt;
    }

    @Data
    public static class GroupResponse {
        private Long id;
        private Long tripId;
        private String departureCity;
        private String destinationCity;
        private LocalDateTime departureTime;
        private Long leaderId;
        private String leaderName;
        private String status;
        private LocalDateTime createdAt;
        private java.util.List<GroupMember> members;
    }

    @Data
    public static class GroupMember {
        private Long id;
        private String username;
        private String realName;
        private Integer creditScore;
    }
}
