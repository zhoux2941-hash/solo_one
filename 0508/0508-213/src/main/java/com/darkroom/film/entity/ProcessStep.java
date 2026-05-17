package com.darkroom.film.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "process_steps")
public class ProcessStep {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "film_id", nullable = false)
    private Long filmId;

    @Column(name = "step_type", nullable = false, length = 50)
    private String stepType;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    private Integer duration;

    @Column(precision = 2)
    private Double temperature;

    @Column(name = "solution_used", length = 100)
    private String solutionUsed;

    @Column(name = "solution_dilution", length = 50)
    private String solutionDilution;

    @Column(length = 100)
    private String agitation;

    @Column(name = "operator_name", length = 100)
    private String operatorName;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFilmId() {
        return filmId;
    }

    public void setFilmId(Long filmId) {
        this.filmId = filmId;
    }

    public String getStepType() {
        return stepType;
    }

    public void setStepType(String stepType) {
        this.stepType = stepType;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public String getSolutionUsed() {
        return solutionUsed;
    }

    public void setSolutionUsed(String solutionUsed) {
        this.solutionUsed = solutionUsed;
    }

    public String getSolutionDilution() {
        return solutionDilution;
    }

    public void setSolutionDilution(String solutionDilution) {
        this.solutionDilution = solutionDilution;
    }

    public String getAgitation() {
        return agitation;
    }

    public void setAgitation(String agitation) {
        this.agitation = agitation;
    }

    public String getOperatorName() {
        return operatorName;
    }

    public void setOperatorName(String operatorName) {
        this.operatorName = operatorName;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}