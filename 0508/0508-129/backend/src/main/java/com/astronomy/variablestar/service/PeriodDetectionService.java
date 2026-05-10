package com.astronomy.variablestar.service;

import com.astronomy.variablestar.dto.PeriodDetectionRequestDTO;
import com.astronomy.variablestar.dto.PeriodDetectionResultDTO;

public interface PeriodDetectionService {
    
    PeriodDetectionResultDTO detectPeriod(PeriodDetectionRequestDTO request);
    
    PeriodDetectionResultDTO detectPeriodForStar(Long starId);
}
