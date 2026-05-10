package com.meteor.dto;

import com.meteor.entity.MeteorRecord;
import com.meteor.entity.ObservationSession;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionDetailResponse {
    private ObservationSession session;
    private List<MeteorRecord> records;
    private RadiantPointResult radiantPoint;
    private ZHRResult zhrResult;
    private Integer predictedZHR;
    private Double zhrComparison;
}
