package com.zoo.monitoring.entity;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "birds")
public class Bird {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "鸟类编号不能为空")
    @Column(unique = true, nullable = false)
    private String birdNo;

    @NotBlank(message = "品种不能为空")
    private String species;

    @NotBlank(message = "笼舍编号不能为空")
    private String cageNo;

    @NotNull(message = "疫苗接种日期不能为空")
    private LocalDate vaccineDate;

    @NotNull(message = "抗体滴度不能为空")
    private Double antibodyTiter;

    private String healthStatus = "正常";

    private Boolean isQuarantined = false;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBirdNo() {
        return birdNo;
    }

    public void setBirdNo(String birdNo) {
        this.birdNo = birdNo;
    }

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public String getCageNo() {
        return cageNo;
    }

    public void setCageNo(String cageNo) {
        this.cageNo = cageNo;
    }

    public LocalDate getVaccineDate() {
        return vaccineDate;
    }

    public void setVaccineDate(LocalDate vaccineDate) {
        this.vaccineDate = vaccineDate;
    }

    public Double getAntibodyTiter() {
        return antibodyTiter;
    }

    public void setAntibodyTiter(Double antibodyTiter) {
        this.antibodyTiter = antibodyTiter;
    }

    public String getHealthStatus() {
        return healthStatus;
    }

    public void setHealthStatus(String healthStatus) {
        this.healthStatus = healthStatus;
    }

    public Boolean getIsQuarantined() {
        return isQuarantined;
    }

    public void setIsQuarantined(Boolean isQuarantined) {
        this.isQuarantined = isQuarantined;
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
}
