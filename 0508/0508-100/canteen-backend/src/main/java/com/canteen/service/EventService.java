package com.canteen.service;

import com.canteen.dto.EventDTO;
import com.canteen.entity.SpecialEvent;
import com.canteen.repository.SpecialEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EventService {

    private static final Logger logger = LoggerFactory.getLogger(EventService.class);

    @Autowired
    private SpecialEventRepository eventRepository;

    public List<EventDTO> getAllEvents() {
        return eventRepository.findAllByOrderByEventDateDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<EventDTO> getRecentEvents(int days) {
        List<SpecialEvent> allEvents = eventRepository.findAllByOrderByEventDateDesc();
        if (allEvents.isEmpty()) {
            return Collections.emptyList();
        }

        Set<LocalDate> uniqueDates = new LinkedHashSet<>();
        for (SpecialEvent event : allEvents) {
            uniqueDates.add(event.getEventDate());
            if (uniqueDates.size() >= days) {
                break;
            }
        }

        if (uniqueDates.isEmpty()) {
            return Collections.emptyList();
        }

        LocalDate oldestDate = new ArrayList<>(uniqueDates).get(uniqueDates.size() - 1);
        return allEvents.stream()
                .filter(e -> !e.getEventDate().isBefore(oldestDate))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Map<LocalDate, List<EventDTO>> getEventsMap(int days) {
        List<EventDTO> events = getRecentEvents(days);
        Map<LocalDate, List<EventDTO>> map = new HashMap<>();
        for (EventDTO event : events) {
            map.computeIfAbsent(event.getEventDate(), k -> new ArrayList<>()).add(event);
        }
        return map;
    }

    @Transactional
    public EventDTO addEvent(EventDTO eventDTO) {
        logger.info("添加事件: date={}, type={}, factor={}", 
                eventDTO.getEventDate(), eventDTO.getEventType(), eventDTO.getImpactFactor());
        
        SpecialEvent event = new SpecialEvent();
        event.setEventDate(eventDTO.getEventDate());
        event.setEventType(eventDTO.getEventType());
        event.setDescription(eventDTO.getDescription());
        event.setImpactFactor(eventDTO.getImpactFactor() != null ? eventDTO.getImpactFactor() : getDefaultImpactFactor(eventDTO.getEventType()));
        event.setCreatedAt(LocalDateTime.now());
        event.setUpdatedAt(LocalDateTime.now());
        
        SpecialEvent saved = eventRepository.save(event);
        logger.info("事件添加成功: id={}", saved.getId());
        return toDTO(saved);
    }

    @Transactional
    public boolean deleteEvent(Long id) {
        if (eventRepository.existsById(id)) {
            eventRepository.deleteById(id);
            logger.info("删除事件: id={}", id);
            return true;
        }
        return false;
    }

    @Transactional
    public EventDTO updateEvent(Long id, EventDTO eventDTO) {
        Optional<SpecialEvent> opt = eventRepository.findById(id);
        if (!opt.isPresent()) {
            return null;
        }
        
        SpecialEvent event = opt.get();
        if (eventDTO.getEventDate() != null) {
            event.setEventDate(eventDTO.getEventDate());
        }
        if (eventDTO.getEventType() != null) {
            event.setEventType(eventDTO.getEventType());
        }
        if (eventDTO.getDescription() != null) {
            event.setDescription(eventDTO.getDescription());
        }
        if (eventDTO.getImpactFactor() != null) {
            event.setImpactFactor(eventDTO.getImpactFactor());
        }
        event.setUpdatedAt(LocalDateTime.now());
        
        return toDTO(eventRepository.save(event));
    }

    private Double getDefaultImpactFactor(String eventType) {
        if ("大型活动".equals(eventType)) {
            return 1.3;
        } else if ("菜品更换".equals(eventType)) {
            return 0.9;
        }
        return 1.0;
    }

    private EventDTO toDTO(SpecialEvent event) {
        return EventDTO.builder()
                .id(event.getId())
                .eventDate(event.getEventDate())
                .eventType(event.getEventType())
                .description(event.getDescription())
                .impactFactor(event.getImpactFactor())
                .build();
    }
}
