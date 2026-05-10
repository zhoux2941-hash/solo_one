package com.lawyer.letter.model;

import java.time.LocalDateTime;

public class LetterTemplate {
    private Long id;
    private String name;
    private String code;
    private String description;
    private String content;
    private String placeholderList;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public LetterTemplate() {
    }

    public LetterTemplate(String name, String code, String description, String content, String placeholderList) {
        this.name = name;
        this.code = code;
        this.description = description;
        this.content = content;
        this.placeholderList = placeholderList;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getPlaceholderList() {
        return placeholderList;
    }

    public void setPlaceholderList(String placeholderList) {
        this.placeholderList = placeholderList;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return name;
    }
}
