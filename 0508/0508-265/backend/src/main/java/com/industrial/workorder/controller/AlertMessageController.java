package com.industrial.workorder.controller;

import com.industrial.workorder.entity.AlertMessage;
import com.industrial.workorder.service.AlertMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AlertMessageController {

    @Autowired
    private AlertMessageService alertMessageService;

    @GetMapping
    public List<AlertMessage> findAll() {
        return alertMessageService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlertMessage> findById(@PathVariable Long id) {
        Optional<AlertMessage> alert = alertMessageService.findById(id);
        return alert.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/unread")
    public List<AlertMessage> findUnread() {
        return alertMessageService.findUnread();
    }

    @GetMapping("/latest")
    public List<AlertMessage> findLatest() {
        return alertMessageService.findLatest();
    }

    @PostMapping
    public AlertMessage create(@RequestBody AlertMessage alert) {
        return alertMessageService.save(alert);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<AlertMessage> markAsRead(@PathVariable Long id) {
        AlertMessage alert = alertMessageService.markAsRead(id);
        if (alert == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(alert);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!alertMessageService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        alertMessageService.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
