package com.water.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "water_district")
public class WaterDistrict {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String street;

    @Column(length = 100)
    private String community;

    @Column(length = 100)
    private String residentialArea;

    private Integer totalHouseholds;

    private Integer residentPopulation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "station_id")
    private Station station;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "main_pipe_id")
    private PipeNetwork mainPipe;

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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getCommunity() {
        return community;
    }

    public void setCommunity(String community) {
        this.community = community;
    }

    public String getResidentialArea() {
        return residentialArea;
    }

    public void setResidentialArea(String residentialArea) {
        this.residentialArea = residentialArea;
    }

    public Integer getTotalHouseholds() {
        return totalHouseholds;
    }

    public void setTotalHouseholds(Integer totalHouseholds) {
        this.totalHouseholds = totalHouseholds;
    }

    public Integer getResidentPopulation() {
        return residentPopulation;
    }

    public void setResidentPopulation(Integer residentPopulation) {
        this.residentPopulation = residentPopulation;
    }

    public Station getStation() {
        return station;
    }

    public void setStation(Station station) {
        this.station = station;
    }

    public PipeNetwork getMainPipe() {
        return mainPipe;
    }

    public void setMainPipe(PipeNetwork mainPipe) {
        this.mainPipe = mainPipe;
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
