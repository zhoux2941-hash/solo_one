package com.autorepair.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import javax.persistence.Entity;
import javax.persistence.Table;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "part")
public class Part extends BaseEntity {
    private String partNo;
    private String name;
    private String brand;
    private String spec;
    private String unit;
    private BigDecimal costPrice;
    private BigDecimal salePrice;
    private Integer stock;
    private Integer warningStock;
    private String location;
    private String remark;
}