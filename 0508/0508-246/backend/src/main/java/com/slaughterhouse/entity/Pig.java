package com.slaughterhouse.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pigs")
public class Pig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String rfidTag;

    private String origin;

    private String immuneRecord;

    private String transportVehicle;

    private String status;

    private LocalDateTime entryTime;

    private String quarantineResult;

    private String quarantineOfficer;

    private LocalDateTime quarantineTime;

    private String carcassId;

    private LocalDateTime slaughterTime;

    private String disposalInfo;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRfidTag() {
        return rfidTag;
    }

    public void setRfidTag(String rfidTag) {
        this.rfidTag = rfidTag;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getImmuneRecord() {
        return immuneRecord;
    }

    public void setImmuneRecord(String immuneRecord) {
        this.immuneRecord = immuneRecord;
    }

    public String getTransportVehicle() {
        return transportVehicle;
    }

    public void setTransportVehicle(String transportVehicle) {
        this.transportVehicle = transportVehicle;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getEntryTime() {
        return entryTime;
    }

    public void setEntryTime(LocalDateTime entryTime) {
        this.entryTime = entryTime;
    }

    public String getQuarantineResult() {
        return quarantineResult;
    }

    public void setQuarantineResult(String quarantineResult) {
        this.quarantineResult = quarantineResult;
    }

    public String getQuarantineOfficer() {
        return quarantineOfficer;
    }

    public void setQuarantineOfficer(String quarantineOfficer) {
        this.quarantineOfficer = quarantineOfficer;
    }

    public LocalDateTime getQuarantineTime() {
        return quarantineTime;
    }

    public void setQuarantineTime(LocalDateTime quarantineTime) {
        this.quarantineTime = quarantineTime;
    }

    public String getCarcassId() {
        return carcassId;
    }

    public void setCarcassId(String carcassId) {
        this.carcassId = carcassId;
    }

    public LocalDateTime getSlaughterTime() {
        return slaughterTime;
    }

    public void setSlaughterTime(LocalDateTime slaughterTime) {
        this.slaughterTime = slaughterTime;
    }

    public String getDisposalInfo() {
        return disposalInfo;
    }

    public void setDisposalInfo(String disposalInfo) {
        this.disposalInfo = disposalInfo;
    }
}
