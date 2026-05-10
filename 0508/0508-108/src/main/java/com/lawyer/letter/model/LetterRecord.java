package com.lawyer.letter.model;

import java.time.LocalDateTime;

public class LetterRecord {
    private Long id;
    private Long templateId;
    private String templateName;
    private String clientName;
    private String counterpartyName;
    private String subject;
    private String formData;
    private String outputPath;
    private LocalDateTime createdAt;

    public LetterRecord() {
    }

    public LetterRecord(Long templateId, String templateName, String clientName, 
                      String counterpartyName, String subject, String formData, String outputPath) {
        this.templateId = templateId;
        this.templateName = templateName;
        this.clientName = clientName;
        this.counterpartyName = counterpartyName;
        this.subject = subject;
        this.formData = formData;
        this.outputPath = outputPath;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getCounterpartyName() {
        return counterpartyName;
    }

    public void setCounterpartyName(String counterpartyName) {
        this.counterpartyName = counterpartyName;
    }

    public String getSubject() {
        return subject;
    }

    public String getFormData() {
        return formData;
    }

    public void setFormData(String formData) {
        this.formData = formData;
    }

    public String getOutputPath() {
        return outputPath;
    }

    public void setOutputPath(String outputPath) {
        this.outputPath = outputPath;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
