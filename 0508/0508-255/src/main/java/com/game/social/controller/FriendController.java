package com.game.social.controller;

import com.game.social.entity.Friend;
import com.game.social.service.FriendService;
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
@RequestMapping("/api/friends")
@CrossOrigin(origins = "*")
public class FriendController {

    @Autowired
    private FriendService friendService;

    @GetMapping("/{playerId}")
    public ResponseEntity<List<Friend>> getFriends(@PathVariable Long playerId) {
        return ResponseEntity.ok(friendService.getFriendsByPlayerId(playerId));
    }

    @PostMapping
    public ResponseEntity<Friend> addFriend(@RequestBody Map<String, Long> request) {
        Long playerId = request.get("playerId");
        Long friendId = request.get("friendId");
        return ResponseEntity.ok(friendService.addFriend(playerId, friendId));
    }

    @DeleteMapping
    public ResponseEntity<Void> removeFriend(@RequestParam Long playerId, @RequestParam Long friendId) {
        friendService.removeFriend(playerId, friendId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{playerId}/page")
    public ResponseEntity<Map<String, Object>> getFriendsWithPagination(
            @PathVariable Long playerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Friend> friendPage = friendService.getFriendsWithPagination(playerId, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", friendPage.getContent());
        response.put("totalElements", friendPage.getTotalElements());
        response.put("totalPages", friendPage.getTotalPages());
        response.put("currentPage", friendPage.getNumber());
        response.put("pageSize", friendPage.getSize());
        response.put("hasNext", friendPage.hasNext());
        response.put("hasPrevious", friendPage.hasPrevious());
        
        return ResponseEntity.ok(response);
    }
}
