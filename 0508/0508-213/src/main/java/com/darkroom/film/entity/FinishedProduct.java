package com.darkroom.film.entity;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "finished_products")
public class FinishedProduct {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "film_id", nullable = false)
    private Long filmId;

    @Column(name = "photos_count", nullable = false)
    private Integer photosCount;

    @Column(name = "negatives_count")
    private Integer negativesCount;

    @Column(name = "scans_count")
    private Integer scansCount;

    @Column(name = "print_size", length = 50)
    private String printSize;

    @Column(name = "delivery_method", length = 50)
    private String deliveryMethod;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "delivered_to", length = 100)
    private String deliveredTo;

    @Column(length = 50)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "PROCESSING";
        }
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

    public Long getFilmId() {
        return filmId;
    }

    public void setFilmId(Long filmId) {
        this.filmId = filmId;
    }

    public Integer getPhotosCount() {
        return photosCount;
    }

    public void setPhotosCount(Integer photosCount) {
        this.photosCount = photosCount;
    }

    public Integer getNegativesCount() {
        return negativesCount;
    }

    public void setNegativesCount(Integer negativesCount) {
        this.negativesCount = negativesCount;
    }

    public Integer getScansCount() {
        return scansCount;
    }

    public void setScansCount(Integer scansCount) {
        this.scansCount = scansCount;
    }

    public String getPrintSize() {
        return printSize;
    }

    public void setPrintSize(String printSize) {
        this.printSize = printSize;
    }

    public String getDeliveryMethod() {
        return deliveryMethod;
    }

    public void setDeliveryMethod(String deliveryMethod) {
        this.deliveryMethod = deliveryMethod;
    }

    public LocalDate getDeliveryDate() {
        return deliveryDate;
    }

    public void setDeliveryDate(LocalDate deliveryDate) {
        this.deliveryDate = deliveryDate;
    }

    public String getDeliveredTo() {
        return deliveredTo;
    }

    public void setDeliveredTo(String deliveredTo) {
        this.deliveredTo = deliveredTo;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}