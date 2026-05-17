package com.airport.lostfound.controller;

import com.airport.lostfound.model.LostClaim;
import com.airport.lostfound.model.MatchResult;
import com.airport.lostfound.service.LostClaimService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/lost-claims")
@CrossOrigin(origins = "*")
public class LostClaimController {

    @Autowired
    private LostClaimService lostClaimService;

    @PostMapping
    public ResponseEntity<LostClaim> create(@Valid @RequestBody LostClaim lostClaim) {
        LostClaim saved = lostClaimService.save(lostClaim);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<LostClaim>> findAll() {
        return ResponseEntity.ok(lostClaimService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LostClaim> findById(@PathVariable Long id) {
        Optional<LostClaim> optional = lostClaimService.findById(id);
        return optional.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/matches")
    public ResponseEntity<List<MatchResult>> findMatches(@PathVariable Long id) {
        List<MatchResult> matches = lostClaimService.findMatchesForClaim(id);
        if (matches == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(matches);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<LostClaim>> findByStatus(@PathVariable String status) {
        return ResponseEntity.ok(lostClaimService.findByStatus(status));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<LostClaim> updateStatus(@PathVariable Long id, @RequestParam String status) {
        LostClaim updated = lostClaimService.updateStatus(id, status);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }
}
