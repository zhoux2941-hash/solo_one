package com.industrial.workorder.dto;

import java.time.LocalDateTime;

public class NotificationMessage {
    private String type;
    private String message;
    private LocalDateTime timestamp;

    public NotificationMessage() {
    }

    public NotificationMessage(String type, String message, LocalDateTime timestamp) {
        this.type = type;
        this.message = message;
        this.timestamp = timestamp;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
