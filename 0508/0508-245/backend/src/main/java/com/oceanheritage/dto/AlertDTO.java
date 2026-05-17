package com.oceanheritage.dto;

public class AlertDTO {

    private Long id;
    private String shipMmsi;
    private String shipName;
    private Long areaId;
    private String areaName;
    private Double lng;
    private Double lat;
    private Double speed;
    private Long alertTime;
    private String evidence;
    private String type;
    private String status;

    public AlertDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getShipMmsi() {
        return shipMmsi;
    }

    public void setShipMmsi(String shipMmsi) {
        this.shipMmsi = shipMmsi;
    }

    public String getShipName() {
        return shipName;
    }

    public void setShipName(String shipName) {
        this.shipName = shipName;
    }

    public Long getAreaId() {
        return areaId;
    }

    public void setAreaId(Long areaId) {
        this.areaId = areaId;
    }

    public String getAreaName() {
        return areaName;
    }

    public void setAreaName(String areaName) {
        this.areaName = areaName;
    }

    public Double getLng() {
        return lng;
    }

    public void setLng(Double lng) {
        this.lng = lng;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public Long getAlertTime() {
        return alertTime;
    }

    public void setAlertTime(Long alertTime) {
        this.alertTime = alertTime;
    }

    public String getEvidence() {
        return evidence;
    }

    public void setEvidence(String evidence) {
        this.evidence = evidence;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
