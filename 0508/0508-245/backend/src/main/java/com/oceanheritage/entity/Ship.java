package com.oceanheritage.entity;

import javax.persistence.*;

@Entity
@Table(name = "ships")
public class Ship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String mmsi;

    @Column(nullable = false)
    private String name;

    private String type;

    private Double length;

    private Double width;

    private Double currentLng;

    private Double currentLat;

    private Double speed;

    private Double heading;

    private Long lastReportTime;

    private Boolean isInsideArea = false;

    public Ship() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMmsi() {
        return mmsi;
    }

    public void setMmsi(String mmsi) {
        this.mmsi = mmsi;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Double getLength() {
        return length;
    }

    public void setLength(Double length) {
        this.length = length;
    }

    public Double getWidth() {
        return width;
    }

    public void setWidth(Double width) {
        this.width = width;
    }

    public Double getCurrentLng() {
        return currentLng;
    }

    public void setCurrentLng(Double currentLng) {
        this.currentLng = currentLng;
    }

    public Double getCurrentLat() {
        return currentLat;
    }

    public void setCurrentLat(Double currentLat) {
        this.currentLat = currentLat;
    }

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public Double getHeading() {
        return heading;
    }

    public void setHeading(Double heading) {
        this.heading = heading;
    }

    public Long getLastReportTime() {
        return lastReportTime;
    }

    public void setLastReportTime(Long lastReportTime) {
        this.lastReportTime = lastReportTime;
    }

    public Boolean getIsInsideArea() {
        return isInsideArea;
    }

    public void setIsInsideArea(Boolean insideArea) {
        isInsideArea = insideArea;
    }
}
