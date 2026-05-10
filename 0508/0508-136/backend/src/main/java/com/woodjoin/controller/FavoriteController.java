package com.woodjoin.controller;

import com.woodjoin.dto.FavoriteDTO;
import com.woodjoin.service.FavoriteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    public ResponseEntity<List<FavoriteDTO>> getAll() {
        List<FavoriteDTO> favorites = favoriteService.getAllFavorites();
        return ResponseEntity.ok(favorites);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FavoriteDTO> getById(@PathVariable Long id) {
        FavoriteDTO favorite = favoriteService.getFavoriteById(id);
        return ResponseEntity.ok(favorite);
    }

    @PostMapping
    public ResponseEntity<FavoriteDTO> create(@Valid @RequestBody FavoriteDTO dto) {
        FavoriteDTO saved = favoriteService.createFavorite(dto);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FavoriteDTO> update(@PathVariable Long id, 
                                              @Valid @RequestBody FavoriteDTO dto) {
        FavoriteDTO updated = favoriteService.updateFavorite(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        favoriteService.deleteFavorite(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "删除成功");
        return ResponseEntity.ok(response);
    }
}