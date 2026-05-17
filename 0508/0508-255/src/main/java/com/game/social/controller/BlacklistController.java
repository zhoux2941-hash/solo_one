package com.game.social.controller;

import com.game.social.entity.Blacklist;
import com.game.social.service.BlacklistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blacklist")
@CrossOrigin(origins = "*")
public class BlacklistController {

    @Autowired
    private BlacklistService blacklistService;

    @GetMapping("/{playerId}")
    public ResponseEntity<List<Blacklist>> getBlacklist(@PathVariable Long playerId) {
        return ResponseEntity.ok(blacklistService.getBlacklistByPlayerId(playerId));
    }

    @GetMapping
    public ResponseEntity<List<Blacklist>> getAllBlacklists() {
        return ResponseEntity.ok(blacklistService.getAllBlacklists());
    }

    @PostMapping
    public ResponseEntity<Blacklist> addToBlacklist(@RequestBody Map<String, Object> request) {
        Long playerId = Long.valueOf(request.get("playerId").toString());
        Long blockedPlayerId = Long.valueOf(request.get("blockedPlayerId").toString());
        String reason = request.get("reason").toString();
        return ResponseEntity.ok(blacklistService.addToBlacklist(playerId, blockedPlayerId, reason));
    }

    @DeleteMapping
    public ResponseEntity<Void> removeFromBlacklist(@RequestParam Long playerId, @RequestParam Long blockedPlayerId) {
        blacklistService.removeFromBlacklist(playerId, blockedPlayerId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/page")
    public ResponseEntity<Map<String, Object>> getBlacklistWithPagination(
            @RequestParam(required = false) Long playerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Blacklist> blacklistPage = blacklistService.getBlacklistWithPagination(playerId, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", blacklistPage.getContent());
        response.put("totalElements", blacklistPage.getTotalElements());
        response.put("totalPages", blacklistPage.getTotalPages());
        response.put("currentPage", blacklistPage.getNumber());
        response.put("pageSize", blacklistPage.getSize());
        response.put("hasNext", blacklistPage.hasNext());
        response.put("hasPrevious", blacklistPage.hasPrevious());
        
        return ResponseEntity.ok(response);
    }
}
