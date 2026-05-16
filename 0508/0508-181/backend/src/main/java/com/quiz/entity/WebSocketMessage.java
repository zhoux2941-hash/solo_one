package com.quiz.entity;

import lombok.Data;

@Data
public class WebSocketMessage {
    private String type;
    private Object data;

    public WebSocketMessage() {}

    public WebSocketMessage(String type, Object data) {
        this.type = type;
        this.data = data;
    }
}
