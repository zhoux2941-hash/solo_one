package com.meteor.controller;

import com.meteor.dto.ConsensusRadiantResult;
import com.meteor.dto.CreateSessionRequest;
import com.meteor.dto.SessionDetailResponse;
import com.meteor.entity.ObservationSession;
import com.meteor.service.ObservationSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
public class ObservationSessionController {

    @Autowired
    private ObservationSessionService sessionService;

    @PostMapping
    public ResponseEntity<ObservationSession> createSession(@Valid @RequestBody CreateSessionRequest request) {
        ObservationSession session = sessionService.createSession(request);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ObservationSession> getSession(@PathVariable Long id) {
        return sessionService.getSession(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<SessionDetailResponse> getSessionDetail(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getSessionDetail(id));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<ObservationSession> endSession(@PathVariable Long id) {
        ObservationSession session = sessionService.endSession(id);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/shower/{showerName}")
    public ResponseEntity<List<ObservationSession>> getSessionsByShower(@PathVariable String showerName) {
        return ResponseEntity.ok(sessionService.getSessionsByShowerName(showerName));
    }

    @GetMapping("/active")
    public ResponseEntity<List<ObservationSession>> getActiveSessions() {
        return ResponseEntity.ok(sessionService.getActiveSessions());
    }

    @GetMapping("/shower/{showerName}/consensus")
    public ResponseEntity<ConsensusRadiantResult> getConsensusRadiant(@PathVariable String showerName) {
        return ResponseEntity.ok(sessionService.getConsensusRadiant(showerName));
    }
}
