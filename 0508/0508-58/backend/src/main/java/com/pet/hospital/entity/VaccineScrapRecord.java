package com.pet.hospital.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vaccine_scrap_records")
public class VaccineScrapRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private VaccineBatch vaccineBatch;

    @Column(name = "batch_number", nullable = false)
    private String batchNumber;

    @Column(name = "vaccine_name", nullable = false)
    private String vaccineName;

    @Column(name = "scrap_quantity", nullable = false)
    private Integer scrapQuantity;

    @Column(name = "reason", nullable = false, length = 500)
    private String reason;

    @Column(name = "scrapped_at", nullable = false)
    private LocalDateTime scrappedAt;

    @Column(name = "operator", nullable = false)
    private String operator;

    @PrePersist
    protected void onCreate() {
        scrappedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public VaccineBatch getVaccineBatch() {
        return vaccineBatch;
    }

    public void setVaccineBatch(VaccineBatch vaccineBatch) {
        this.vaccineBatch = vaccineBatch;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
    }

    public String getVaccineName() {
        return vaccineName;
    }

    public void setVaccineName(String vaccineName) {
        this.vaccineName = vaccineName;
    }

    public Integer getScrapQuantity() {
        return scrapQuantity;
    }

    public void setScrapQuantity(Integer scrapQuantity) {
        this.scrapQuantity = scrapQuantity;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getScrappedAt() {
        return scrappedAt;
    }

    public void setScrappedAt(LocalDateTime scrappedAt) {
        this.scrappedAt = scrappedAt;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
    }
}
