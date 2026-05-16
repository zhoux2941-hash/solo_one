package com.asset.model;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;

@Entity
@Table(name = "assets")
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "资产编号不能为空")
    @Column(unique = true, nullable = false)
    private String assetNumber;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "资产类型不能为空")
    private AssetType type;

    @NotBlank(message = "品牌不能为空")
    private String brand;

    @NotNull(message = "购买日期不能为空")
    private LocalDate purchaseDate;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "资产状态不能为空")
    private AssetStatus status;

    private String currentHolder;

    private String holderDepartment;

    private LocalDate allocateDate;

    private LocalDate expectedReturnDate;

    private String remarks;

    public Asset() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAssetNumber() {
        return assetNumber;
    }

    public void setAssetNumber(String assetNumber) {
        this.assetNumber = assetNumber;
    }

    public AssetType getType() {
        return type;
    }

    public void setType(AssetType type) {
        this.type = type;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public AssetStatus getStatus() {
        return status;
    }

    public void setStatus(AssetStatus status) {
        this.status = status;
    }

    public String getCurrentHolder() {
        return currentHolder;
    }

    public void setCurrentHolder(String currentHolder) {
        this.currentHolder = currentHolder;
    }

    public String getHolderDepartment() {
        return holderDepartment;
    }

    public void setHolderDepartment(String holderDepartment) {
        this.holderDepartment = holderDepartment;
    }

    public LocalDate getAllocateDate() {
        return allocateDate;
    }

    public void setAllocateDate(LocalDate allocateDate) {
        this.allocateDate = allocateDate;
    }

    public LocalDate getExpectedReturnDate() {
        return expectedReturnDate;
    }

    public void setExpectedReturnDate(LocalDate expectedReturnDate) {
        this.expectedReturnDate = expectedReturnDate;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
