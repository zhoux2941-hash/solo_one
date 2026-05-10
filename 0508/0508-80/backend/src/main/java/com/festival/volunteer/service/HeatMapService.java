package com.festival.volunteer.service;

import com.festival.volunteer.dto.HeatMapStats;
import com.festival.volunteer.entity.Position;
import com.festival.volunteer.entity.Schedule;
import com.festival.volunteer.repository.PositionRepository;
import com.festival.volunteer.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HeatMapService {

    private final ScheduleRepository scheduleRepository;
    private final PositionRepository positionRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public List<HeatMapStats> getHeatMapData() {
        List<Schedule> schedules = scheduleRepository.findAll();
        List<Position> positions = positionRepository.findAll();
        
        List<String> dates = getDateRange(schedules);
        List<String> timeSlots = Arrays.asList(
            "06:00-08:00", "08:00-10:00", "10:00-12:00",
            "12:00-14:00", "14:00-16:00", "16:00-18:00",
            "18:00-20:00", "20:00-22:00", "22:00-24:00"
        );

        Map<Position, Map<String, Map<String, Integer>>> positionStats = new LinkedHashMap<>();
        
        for (Position position : positions) {
            positionStats.put(position, new LinkedHashMap<>());
            for (String date : dates) {
                positionStats.get(position).put(date, new LinkedHashMap<>());
                for (String slot : timeSlots) {
                    positionStats.get(position).get(date).put(slot, 0);
                }
            }
        }

        for (Schedule schedule : schedules) {
            Position pos = schedule.getPosition();
            String date = schedule.getScheduleDate();
            String timeSlot = mapToTimeSlot(schedule.getStartTime(), schedule.getEndTime());
            
            if (positionStats.containsKey(pos) && 
                positionStats.get(pos).containsKey(date) &&
                positionStats.get(pos).get(date).containsKey(timeSlot)) {
                int current = positionStats.get(pos).get(date).get(timeSlot);
                positionStats.get(pos).get(date).put(timeSlot, current + 1);
            }
        }

        List<HeatMapStats> result = new ArrayList<>();
        for (Position position : positions) {
            for (String date : dates) {
                for (String slot : timeSlots) {
                    Integer count = positionStats.get(position).get(date).get(slot);
                    if (count != null && count > 0) {
                        result.add(new HeatMapStats(
                            date,
                            slot,
                            position.getName(),
                            count,
                            position.getRequiredCount()
                        ));
                    }
                }
            }
        }

        return result;
    }

    public Map<String, Object> getHeatMapDataByPosition() {
        List<Schedule> schedules = scheduleRepository.findAll();
        List<Position> positions = positionRepository.findAll();
        
        List<String> dates = getDateRange(schedules);
        List<String> timeSlots = Arrays.asList(
            "06:00-08:00", "08:00-10:00", "10:00-12:00",
            "12:00-14:00", "14:00-16:00", "16:00-18:00",
            "18:00-20:00", "20:00-22:00", "22:00-24:00"
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("dates", dates);
        result.put("timeSlots", timeSlots);
        
        List<Map<String, Object>> positionDataList = new ArrayList<>();
        
        for (Position position : positions) {
            Map<String, Object> positionData = new LinkedHashMap<>();
            positionData.put("positionId", position.getId());
            positionData.put("positionName", position.getName());
            positionData.put("positionType", position.getType());
            positionData.put("requiredCount", position.getRequiredCount());
            
            List<List<Integer>> heatData = new ArrayList<>();
            
            for (int dateIdx = 0; dateIdx < dates.size(); dateIdx++) {
                String date = dates.get(dateIdx);
                for (int slotIdx = 0; slotIdx < timeSlots.size(); slotIdx++) {
                    String slot = timeSlots.get(slotIdx);
                    
                    int count = 0;
                    for (Schedule schedule : schedules) {
                        if (schedule.getPosition().getId().equals(position.getId()) &&
                            schedule.getScheduleDate().equals(date)) {
                            String scheduleSlot = mapToTimeSlot(schedule.getStartTime(), schedule.getEndTime());
                            if (scheduleSlot.equals(slot)) {
                                count++;
                            }
                        }
                    }
                    
                    if (count > 0) {
                        heatData.add(Arrays.asList(dateIdx, slotIdx, count));
                    }
                }
            }
            
            positionData.put("data", heatData);
            positionDataList.add(positionData);
        }
        
        result.put("positions", positionDataList);
        
        return result;
    }

    private List<String> getDateRange(List<Schedule> schedules) {
        if (schedules.isEmpty()) {
            LocalDate today = LocalDate.now();
            List<String> dates = new ArrayList<>();
            for (int i = 0; i < 7; i++) {
                dates.add(today.plusDays(i).format(DATE_FORMATTER));
            }
            return dates;
        }

        Set<String> dateSet = schedules.stream()
                .map(Schedule::getScheduleDate)
                .collect(Collectors.toTreeSet());
        
        return new ArrayList<>(dateSet);
    }

    private String mapToTimeSlot(String startTime, String endTime) {
        try {
            int startHour = Integer.parseInt(startTime.split(":")[0]);
            
            String[] slots = {
                "06:00-08:00", "08:00-10:00", "10:00-12:00",
                "12:00-14:00", "14:00-16:00", "16:00-18:00",
                "18:00-20:00", "20:00-22:00", "22:00-24:00"
            };
            
            int slotIndex = Math.min(Math.max((startHour - 6) / 2, 0), slots.length - 1);
            return slots[slotIndex];
            
        } catch (Exception e) {
            return "10:00-12:00";
        }
    }
}
