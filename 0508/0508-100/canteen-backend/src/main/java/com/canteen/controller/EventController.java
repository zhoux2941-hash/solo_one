package com.canteen.controller;

import com.canteen.dto.EventDTO;
import com.canteen.service.EventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private static final Logger logger = LoggerFactory.getLogger(EventController.class);

    @Autowired
    private EventService eventService;

    @GetMapping
    public ResponseEntity<List<EventDTO>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @GetMapping("/recent")
    public ResponseEntity<List<EventDTO>> getRecentEvents(@RequestParam(defaultValue = "60") int days) {
        return ResponseEntity.ok(eventService.getRecentEvents(days));
    }

    @PostMapping
    public ResponseEntity<EventDTO> addEvent(@RequestBody EventDTO eventDTO) {
        logger.info("收到添加事件请求: {}", eventDTO);
        EventDTO saved = eventService.addEvent(eventDTO);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventDTO> updateEvent(@PathVariable Long id, @RequestBody EventDTO eventDTO) {
        EventDTO updated = eventService.updateEvent(id, eventDTO);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteEvent(@PathVariable Long id) {
        boolean deleted = eventService.deleteEvent(id);
        Map<String, Boolean> result = new HashMap<>();
        result.put("success", deleted);
        return ResponseEntity.ok(result);
    }
}
