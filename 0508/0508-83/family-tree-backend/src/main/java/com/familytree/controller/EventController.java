package com.familytree.controller;

import com.familytree.dto.EventDTO;
import com.familytree.entity.Event;
import com.familytree.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/family-spaces/{familySpaceId}/events")
@CrossOrigin
public class EventController {
    @Autowired
    private EventService eventService;

    @GetMapping
    public ResponseEntity<?> getFamilySpaceEvents(@PathVariable Long familySpaceId) {
        try {
            List<Event> events = eventService.getFamilySpaceEvents(familySpaceId);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", events);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @GetMapping("/timeline")
    public ResponseEntity<?> getTimelineEvents(@PathVariable Long familySpaceId) {
        try {
            Map<Integer, List<Map<String, Object>>> timeline = eventService.getTimelineEvents(familySpaceId);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", timeline);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @GetMapping("/person/{personId}")
    public ResponseEntity<?> getPersonEvents(@PathVariable Long familySpaceId, @PathVariable Long personId) {
        try {
            List<Event> events = eventService.getPersonEvents(familySpaceId, personId);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", events);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@PathVariable Long familySpaceId, @Validated @RequestBody EventDTO dto) {
        try {
            Event event = eventService.createEvent(familySpaceId, dto);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "事件添加成功");
            result.put("data", event);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<?> updateEvent(@PathVariable Long familySpaceId, @PathVariable Long eventId, 
                                          @Validated @RequestBody EventDTO dto) {
        try {
            Event event = eventService.updateEvent(familySpaceId, eventId, dto);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "事件更新成功");
            result.put("data", event);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long familySpaceId, @PathVariable Long eventId) {
        try {
            eventService.deleteEvent(familySpaceId, eventId);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "事件删除成功");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }
}
