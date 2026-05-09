package com.pool.entity;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "lane_tolerance", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"lane_name", "record_date"})
})
public class LaneTolerance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lane_name", nullable = false)
    private String laneName;

    @Column(name = "tolerance_value", nullable = false)
    private Integer toleranceValue;

    @Column(name = "zone")
    private String zone;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    public LaneTolerance() {
    }

    public LaneTolerance(String laneName, Integer toleranceValue, String zone, LocalDate recordDate) {
        this.laneName = laneName;
        this.toleranceValue = toleranceValue;
        this.zone = zone;
        this.recordDate = recordDate;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLaneName() {
        return laneName;
    }

    public void setLaneName(String laneName) {
        this.laneName = laneName;
    }

    public Integer getToleranceValue() {
        return toleranceValue;
    }

    public void setToleranceValue(Integer toleranceValue) {
        this.toleranceValue = toleranceValue;
    }

    public String getZone() {
        return zone;
    }

    public void setZone(String zone) {
        this.zone = zone;
    }

    public LocalDate getRecordDate() {
        return recordDate;
    }

    public void setRecordDate(LocalDate recordDate) {
        this.recordDate = recordDate;
    }
}
