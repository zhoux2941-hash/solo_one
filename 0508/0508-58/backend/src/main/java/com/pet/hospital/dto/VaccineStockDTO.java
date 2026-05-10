package com.pet.hospital.dto;

import java.util.List;

public class VaccineStockDTO {

    private Long vaccineId;
    private String vaccineName;
    private String description;
    private String manufacturer;
    private Integer totalQuantity;
    private List<VaccineBatchDTO> batches;

    public Long getVaccineId() {
        return vaccineId;
    }

    public void setVaccineId(Long vaccineId) {
        this.vaccineId = vaccineId;
    }

    public String getVaccineName() {
        return vaccineName;
    }

    public void setVaccineName(String vaccineName) {
        this.vaccineName = vaccineName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public Integer getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(Integer totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public List<VaccineBatchDTO> getBatches() {
        return batches;
    }

    public void setBatches(List<VaccineBatchDTO> batches) {
        this.batches = batches;
    }
}
