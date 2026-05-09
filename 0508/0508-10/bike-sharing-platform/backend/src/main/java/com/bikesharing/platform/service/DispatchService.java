package com.bikesharing.platform.service;

import com.bikesharing.platform.dto.DispatchSuggestionDTO;
import com.bikesharing.platform.dto.ParkingPointStatusDTO;
import com.bikesharing.platform.dto.PredictionDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DispatchService {

    private final ParkingPointService parkingPointService;
    private final PredictionService predictionService;

    public List<DispatchSuggestionDTO> generateDispatchSuggestions() {
        List<DispatchSuggestionDTO> suggestions = new ArrayList<>();
        
        List<ParkingPointStatusDTO> points = parkingPointService.getAllParkingPointStatus();
        List<PredictionDTO> predictions = predictionService.getNext2HoursPredictions();
        
        Map<Long, List<PredictionDTO>> predictionsByPoint = predictions.stream()
            .collect(Collectors.groupingBy(PredictionDTO::getPointId));
        
        List<ParkingPointStatusDTO> overSaturated = new ArrayList<>();
        List<ParkingPointStatusDTO> shortage = new ArrayList<>();
        
        for (ParkingPointStatusDTO point : points) {
            String status = point.getStatus();
            if ("OVER_SATURATED".equals(status)) {
                overSaturated.add(point);
            } else if ("SHORTAGE".equals(status)) {
                shortage.add(point);
            }
        }
        
        Map<Long, Integer> netDemand = new HashMap<>();
        for (ParkingPointStatusDTO point : points) {
            List<PredictionDTO> pointPredictions = predictionsByPoint.getOrDefault(point.getPointId(), new ArrayList<>());
            int totalBorrow = pointPredictions.stream().mapToInt(PredictionDTO::getPredictedBorrowDemand).sum();
            int totalReturn = pointPredictions.stream().mapToInt(PredictionDTO::getPredictedReturnDemand).sum();
            netDemand.put(point.getPointId(), totalBorrow - totalReturn);
        }
        
        overSaturated.sort((a, b) -> {
            double rateDiff = b.getUtilizationRate() - a.getUtilizationRate();
            if (Math.abs(rateDiff) > 0.001) return Double.compare(b.getUtilizationRate(), a.getUtilizationRate());
            int bikesA = a.getCurrentBikes() - (int)(a.getCapacity() * 0.5);
            int bikesB = b.getCurrentBikes() - (int)(b.getCapacity() * 0.5);
            return Integer.compare(bikesB, bikesA);
        });
        
        shortage.sort((a, b) -> {
            double rateDiff = a.getUtilizationRate() - b.getUtilizationRate();
            if (Math.abs(rateDiff) > 0.001) return Double.compare(a.getUtilizationRate(), b.getUtilizationRate());
            int demandA = netDemand.getOrDefault(a.getPointId(), 0);
            int demandB = netDemand.getOrDefault(b.getPointId(), 0);
            return Integer.compare(demandB, demandA);
        });
        
        int fromIdx = 0;
        int toIdx = 0;
        
        while (fromIdx < overSaturated.size() && toIdx < shortage.size()) {
            ParkingPointStatusDTO from = overSaturated.get(fromIdx);
            ParkingPointStatusDTO to = shortage.get(toIdx);
            
            int surplus = from.getCurrentBikes() - (int)(from.getCapacity() * 0.6);
            int needed = (int)(to.getCapacity() * 0.4) - to.getCurrentBikes();
            
            if (surplus <= 0) {
                fromIdx++;
                continue;
            }
            if (needed <= 0) {
                toIdx++;
                continue;
            }
            
            int transfer = Math.min(surplus, needed);
            transfer = Math.max(1, transfer);
            
            double distance = calculateDistance(from.getLatitude(), from.getLongitude(),
                                                  to.getLatitude(), to.getLongitude());
            
            String reason = generateReason(from, to, netDemand);
            
            suggestions.add(DispatchSuggestionDTO.builder()
                .fromPointId(from.getPointId())
                .fromPointName(from.getName())
                .toPointId(to.getPointId())
                .toPointName(to.getName())
                .bikeCount(transfer)
                .reason(reason)
                .estimatedDistance(distance)
                .build());
            
            from.setCurrentBikes(from.getCurrentBikes() - transfer);
            to.setCurrentBikes(to.getCurrentBikes() + transfer);
            
            if (from.getUtilizationRate() <= 0.7) fromIdx++;
            if (to.getUtilizationRate() >= 0.3) toIdx++;
        }
        
        return suggestions;
    }

    private String generateReason(ParkingPointStatusDTO from, ParkingPointStatusDTO to, Map<Long, Integer> netDemand) {
        StringBuilder sb = new StringBuilder();
        
        if (from.getUtilizationRate() > 0.85) {
            sb.append("调出点").append(from.getName()).append("严重过饱和（使用率").append(String.format("%.0f%%", from.getUtilizationRate() * 100)).append("）");
        } else {
            sb.append("调出点").append(from.getName()).append("车辆富余（使用率").append(String.format("%.0f%%", from.getUtilizationRate() * 100)).append("）");
        }
        
        sb.append("；");
        
        if (to.getUtilizationRate() < 0.1) {
            sb.append("调入点").append(to.getName()).append("严重紧缺（使用率").append(String.format("%.0f%%", to.getUtilizationRate() * 100)).append("）");
        } else {
            sb.append("调入点").append(to.getName()).append("车辆不足（使用率").append(String.format("%.0f%%", to.getUtilizationRate() * 100)).append("）");
        }
        
        int toDemand = netDemand.getOrDefault(to.getPointId(), 0);
        if (toDemand > 0) {
            sb.append("，预测未来2小时净需求+").append(toDemand).append("辆");
        }
        
        return sb.toString();
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
}
