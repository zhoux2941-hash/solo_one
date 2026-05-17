package com.airport.lostfound.model;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "claim_appointments")
public class ClaimAppointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "物品ID不能为空")
    private Long foundItemId;

    @NotNull(message = "申报ID不能为空")
    private Long lostClaimId;

    @NotBlank(message = "乘客姓名不能为空")
    private String passengerName;

    @NotBlank(message = "身份证号不能为空")
    private String idCardNumber;

    @NotBlank(message = "联系方式不能为空")
    private String contactInfo;

    @NotNull(message = "预约日期不能为空")
    private LocalDate appointmentDate;

    @NotNull(message = "预约时间不能为空")
    private LocalTime appointmentTime;

    private String status;

    private LocalDate createdAt;

    public ClaimAppointment() {
        this.status = "待核验";
        this.createdAt = LocalDate.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFoundItemId() {
        return foundItemId;
    }

    public void setFoundItemId(Long foundItemId) {
        this.foundItemId = foundItemId;
    }

    public Long getLostClaimId() {
        return lostClaimId;
    }

    public void setLostClaimId(Long lostClaimId) {
        this.lostClaimId = lostClaimId;
    }

    public String getPassengerName() {
        return passengerName;
    }

    public void setPassengerName(String passengerName) {
        this.passengerName = passengerName;
    }

    public String getIdCardNumber() {
        return idCardNumber;
    }

    public void setIdCardNumber(String idCardNumber) {
        this.idCardNumber = idCardNumber;
    }

    public String getContactInfo() {
        return contactInfo;
    }

    public void setContactInfo(String contactInfo) {
        this.contactInfo = contactInfo;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public LocalTime getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(LocalTime appointmentTime) {
        this.appointmentTime = appointmentTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }
}
