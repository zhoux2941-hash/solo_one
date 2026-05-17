package com.game.social.controller;

import com.game.social.entity.Player;
import com.game.social.service.PlayerService;
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
@RequestMapping("/api/players")
@CrossOrigin(origins = "*")
public class PlayerController {

    @Autowired
    private PlayerService playerService;

    @GetMapping
    public ResponseEntity<List<Player>> getAllPlayers() {
        return ResponseEntity.ok(playerService.getAllPlayers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Player> getPlayerById(@PathVariable Long id) {
        return playerService.getPlayerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Player> createPlayer(@RequestBody Player player) {
        return ResponseEntity.ok(playerService.createPlayer(player));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Player> updatePlayer(@PathVariable Long id, @RequestBody Player playerDetails) {
        return ResponseEntity.ok(playerService.updatePlayer(id, playerDetails));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlayer(@PathVariable Long id) {
        playerService.deletePlayer(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<Player>> searchPlayers(@RequestParam String nickname) {
        return ResponseEntity.ok(playerService.searchPlayersByNickname(nickname));
    }

    @GetMapping("/page")
    public ResponseEntity<Map<String, Object>> getPlayersWithPagination(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Player> playerPage = playerService.getPlayersWithPagination(pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", playerPage.getContent());
        response.put("totalElements", playerPage.getTotalElements());
        response.put("totalPages", playerPage.getTotalPages());
        response.put("currentPage", playerPage.getNumber());
        response.put("pageSize", playerPage.getSize());
        response.put("hasNext", playerPage.hasNext());
        response.put("hasPrevious", playerPage.hasPrevious());
        
        return ResponseEntity.ok(response);
    }
}
