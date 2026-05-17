package com.oceanheritage.entity;

import javax.persistence.Embeddable;

@Embeddable
public class Coordinate {

    private Double lng;

    private Double lat;

    public Coordinate() {
    }

    public Coordinate(Double lng, Double lat) {
        this.lng = lng;
        this.lat = lat;
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
}
