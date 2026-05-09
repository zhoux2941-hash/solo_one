package com.blindpath.monitor.service.impl;

import com.blindpath.monitor.dto.DetectionPointDTO;
import com.blindpath.monitor.entity.DetectionPoint;
import com.blindpath.monitor.repository.DetectionPointRepository;
import com.blindpath.monitor.service.DetectionPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DetectionPointServiceImpl implements DetectionPointService {

    private final DetectionPointRepository detectionPointRepository;

    @Override
    public List<DetectionPointDTO> getDetectionPointsByDate(LocalDate date) {
        List<DetectionPoint> points = detectionPointRepository.findByRecordDateOrderByDistanceAsc(date);
        return points.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private DetectionPointDTO convertToDTO(DetectionPoint entity) {
        return new DetectionPointDTO(entity.getDistance(), entity.getWearDegree());
    }
}
