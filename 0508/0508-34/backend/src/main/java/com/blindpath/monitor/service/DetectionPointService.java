package com.blindpath.monitor.service;

import com.blindpath.monitor.dto.DetectionPointDTO;

import java.time.LocalDate;
import java.util.List;

public interface DetectionPointService {
    List<DetectionPointDTO> getDetectionPointsByDate(LocalDate date);
}
