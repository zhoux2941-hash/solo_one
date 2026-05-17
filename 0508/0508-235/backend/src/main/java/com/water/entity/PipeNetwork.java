package com.water.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pipe_network")
public class PipeNetwork {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String roadSection;

    @Column(nullable = false, length = 50)
    private String pipeDiameter;

    private Integer layYear;

    private Double buryDepth;

    @Column(length = 50)
    private String pipeMaterial;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "station_id")
    private Station station;

    @Column(length = 500)
    private String remark;

    @Column(nullable = false)
    private Boolean active = true;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoadSection() {
        return roadSection;
    }

    public void setRoadSection(String roadSection) {
        this.roadSection = roadSection;
    }

    public String getPipeDiameter() {
        return pipeDiameter;
    }

    public void setPipeDiameter(String pipeDiameter) {
        this.pipeDiameter = pipeDiameter;
    }

    public Integer getLayYear() {
        return layYear;
    }

    public void setLayYear(Integer layYear) {
        this.layYear = layYear;
    }

    public Double getBuryDepth() {
        return buryDepth;
    }

    public void setBuryDepth(Double buryDepth) {
        this.buryDepth = buryDepth;
    }

    public String getPipeMaterial() {
        return pipeMaterial;
    }

    public void setPipeMaterial(String pipeMaterial) {
        this.pipeMaterial = pipeMaterial;
    }

    public Station getStation() {
        return station;
    }

    public void setStation(Station station) {
        this.station = station;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public LocalDateTime getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }
}
