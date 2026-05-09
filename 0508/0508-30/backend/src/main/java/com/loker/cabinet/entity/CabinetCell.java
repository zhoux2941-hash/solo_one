package com.loker.cabinet.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CabinetCell implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String column;
    private int row;
    private String cellId;
    private int fatigueScore;
}
