package com.autorepair.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import javax.persistence.Entity;
import javax.persistence.Table;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "customer")
public class Customer extends BaseEntity {
    private String name;
    private String phone;
    private String wechat;
    private String address;
    private String remark;
}