package com.petclean.controller;

import com.petclean.entity.Community;
import com.petclean.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @GetMapping("/stats")
    public ResponseEntity<Community> getCommunityStats() {
        Optional<Community> stats = communityService.getCommunityStats();
        return stats.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/cleanliness")
    public ResponseEntity<Integer> getCleanliness() {
        return ResponseEntity.ok(communityService.getCleanliness());
    }
}
