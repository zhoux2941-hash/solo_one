package com.opera.mask.controller;

import com.opera.mask.common.Result;
import com.opera.mask.entity.UserFavorite;
import com.opera.mask.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping("/toggle")
    public Result<Boolean> toggleFavorite(@RequestBody ToggleFavoriteRequest request) {
        boolean result = favoriteService.toggleFavorite(request.getUserId(), request.getDesignId());
        return Result.success(result);
    }

    @GetMapping("/check")
    public Result<Boolean> checkFavorite(
            @RequestParam Long userId,
            @RequestParam Long designId) {
        return Result.success(favoriteService.isFavorited(userId, designId));
    }

    @GetMapping("/user/{userId}")
    public Result<List<UserFavorite>> getUserFavorites(@PathVariable Long userId) {
        return Result.success(favoriteService.getUserFavorites(userId));
    }

    @GetMapping("/count/{designId}")
    public Result<Integer> getFavoriteCount(@PathVariable Long designId) {
        return Result.success(favoriteService.getFavoriteCount(designId));
    }

    @lombok.Data
    public static class ToggleFavoriteRequest {
        private Long userId;
        private Long designId;
    }
}
