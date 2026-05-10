package com.familytree.service;

import com.familytree.dto.EventDTO;
import com.familytree.entity.Event;
import com.familytree.entity.FamilySpace;
import com.familytree.entity.Person;
import com.familytree.repository.EventRepository;
import com.familytree.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EventService {
    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private FamilySpaceService familySpaceService;

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private TreeCacheService treeCacheService;

    public List<Event> getPersonEvents(Long familySpaceId, Long personId) {
        familySpaceService.getFamilySpace(familySpaceId);
        Person person = personRepository.findById(personId)
            .orElseThrow(() -> new RuntimeException("人员不存在"));
        return eventRepository.findByPersonOrderByYearAscMonthAscDayAsc(person);
    }

    public List<Event> getFamilySpaceEvents(Long familySpaceId) {
        familySpaceService.getFamilySpace(familySpaceId);
        return eventRepository.findByFamilySpaceIdOrderByYearAscMonthAscDayAsc(familySpaceId);
    }

    public Map<Integer, List<Map<String, Object>>> getTimelineEvents(Long familySpaceId) {
        List<Event> events = getFamilySpaceEvents(familySpaceId);
        Map<Integer, List<Map<String, Object>>> timeline = new HashMap<>();
        
        for (Event event : events) {
            Integer year = event.getYear();
            if (!timeline.containsKey(year)) {
                timeline.put(year, new ArrayList<>());
            }
            
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("id", event.getId());
            eventData.put("title", event.getTitle());
            eventData.put("year", event.getYear());
            eventData.put("month", event.getMonth());
            eventData.put("day", event.getDay());
            eventData.put("type", event.getType());
            eventData.put("description", event.getDescription());
            eventData.put("location", event.getLocation());
            
            Person person = event.getPerson();
            if (person != null) {
                Map<String, Object> personData = new HashMap<>();
                personData.put("id", person.getId());
                personData.put("name", person.getName());
                personData.put("gender", person.getGender());
                personData.put("avatar", person.getAvatar());
                eventData.put("person", personData);
            }
            
            timeline.get(year).add(eventData);
        }
        
        return timeline;
    }

    @Transactional
    public Event createEvent(Long familySpaceId, EventDTO dto) {
        FamilySpace space = familySpaceService.getFamilySpace(familySpaceId);
        Person person = personRepository.findById(dto.getPersonId())
            .orElseThrow(() -> new RuntimeException("人员不存在"));
        
        Event event = new Event();
        event.setTitle(dto.getTitle());
        event.setYear(dto.getYear());
        event.setMonth(dto.getMonth());
        event.setDay(dto.getDay());
        event.setType(dto.getType());
        event.setDescription(dto.getDescription());
        event.setLocation(dto.getLocation());
        event.setPerson(person);
        event.setFamilySpace(space);
        
        Event saved = eventRepository.save(event);
        treeCacheService.invalidateTreeCache(familySpaceId);
        return saved;
    }

    @Transactional
    public Event updateEvent(Long familySpaceId, Long eventId, EventDTO dto) {
        familySpaceService.getFamilySpace(familySpaceId);
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("事件不存在"));
        
        event.setTitle(dto.getTitle());
        event.setYear(dto.getYear());
        event.setMonth(dto.getMonth());
        event.setDay(dto.getDay());
        event.setType(dto.getType());
        event.setDescription(dto.getDescription());
        event.setLocation(dto.getLocation());
        
        if (dto.getPersonId() != null && !dto.getPersonId().equals(event.getPerson().getId())) {
            Person person = personRepository.findById(dto.getPersonId())
                .orElseThrow(() -> new RuntimeException("人员不存在"));
            event.setPerson(person);
        }
        
        Event saved = eventRepository.save(event);
        treeCacheService.invalidateTreeCache(familySpaceId);
        return saved;
    }

    @Transactional
    public void deleteEvent(Long familySpaceId, Long eventId) {
        familySpaceService.getFamilySpace(familySpaceId);
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("事件不存在"));
        eventRepository.delete(event);
        treeCacheService.invalidateTreeCache(familySpaceId);
    }
}
