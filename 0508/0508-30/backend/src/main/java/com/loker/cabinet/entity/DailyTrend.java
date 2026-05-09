package com.loker.cabinet.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyTrend implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private LocalDate date;
    private int dailyIncrement;
    private int totalFatigue;
}
