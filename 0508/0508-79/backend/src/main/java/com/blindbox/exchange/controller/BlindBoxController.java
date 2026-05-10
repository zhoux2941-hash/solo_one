package com.blindbox.exchange.controller;

import com.blindbox.exchange.dto.ApiResponse;
import com.blindbox.exchange.dto.BlindBoxRequest;
import com.blindbox.exchange.dto.PageResponse;
import com.blindbox.exchange.entity.BlindBox;
import com.blindbox.exchange.entity.User;
import com.blindbox.exchange.security.JwtTokenProvider;
import com.blindbox.exchange.service.BlindBoxService;
import com.blindbox.exchange.service.HotSeriesService;
import com.blindbox.exchange.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/boxes")
@RequiredArgsConstructor
public class BlindBoxController {

    private final BlindBoxService blindBoxService;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final HotSeriesService hotSeriesService;

    private Long getCurrentUserId(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            return jwtTokenProvider.getUserIdFromJWT(token.substring(7));
        }
        return null;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BlindBox>> createBox(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody BlindBoxRequest request) {
        Long userId = getCurrentUserId(token);
        User user = userService.getCurrentUser(userId);
        BlindBox box = blindBoxService.createBlindBox(user, request);
        return ResponseEntity.ok(ApiResponse.success("创建成功", box));
    }

    @PutMapping("/{boxId}")
    public ResponseEntity<ApiResponse<BlindBox>> updateBox(
            @RequestHeader("Authorization") String token,
            @PathVariable Long boxId,
            @Valid @RequestBody BlindBoxRequest request) {
        Long userId = getCurrentUserId(token);
        BlindBox box = blindBoxService.updateBlindBox(userId, boxId, request);
        return ResponseEntity.ok(ApiResponse.success("更新成功", box));
    }

    @DeleteMapping("/{boxId}")
    public ResponseEntity<ApiResponse<Void>> deleteBox(
            @RequestHeader("Authorization") String token,
            @PathVariable Long boxId) {
        Long userId = getCurrentUserId(token);
        blindBoxService.deleteBlindBox(userId, boxId);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BlindBox>>> getMyBoxes(
            @RequestHeader("Authorization") String token) {
        Long userId = getCurrentUserId(token);
        List<BlindBox> boxes = blindBoxService.getUserBoxes(userId);
        return ResponseEntity.ok(ApiResponse.success(boxes));
    }

    @GetMapping("/my/available")
    public ResponseEntity<ApiResponse<List<BlindBox>>> getMyAvailableBoxes(
            @RequestHeader("Authorization") String token) {
        Long userId = getCurrentUserId(token);
        List<BlindBox> boxes = blindBoxService.getUserAvailableBoxes(userId);
        return ResponseEntity.ok(ApiResponse.success(boxes));
    }

    @GetMapping("/{boxId}")
    public ResponseEntity<ApiResponse<BlindBox>> getBoxDetail(
            @RequestHeader(value = "Authorization", required = false) String token,
            @PathVariable Long boxId) {
        Long userId = getCurrentUserId(token);
        BlindBox box = blindBoxService.getBoxById(boxId, userId);
        if (box.getSeriesName() != null) {
            hotSeriesService.incrementSeriesView(box.getSeriesName());
        }
        return ResponseEntity.ok(ApiResponse.success(box));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<BlindBox>>> searchBoxes(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam(required = false) String seriesName,
            @RequestParam(required = false) String styleName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(token);
        PageResponse<BlindBox> boxes = blindBoxService.searchBoxes(seriesName, styleName, userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(boxes));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<PageResponse<BlindBox>>> getAllAvailableBoxes(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(token);
        PageResponse<BlindBox> boxes = blindBoxService.getAllAvailableBoxes(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(boxes));
    }

    @GetMapping("/series")
    public ResponseEntity<ApiResponse<List<String>>> getAllSeries() {
        List<String> series = blindBoxService.getAllSeries();
        return ResponseEntity.ok(ApiResponse.success(series));
    }

    @GetMapping("/hot-series")
    public ResponseEntity<ApiResponse<Map<String, Double>>> getHotSeries(
            @RequestParam(defaultValue = "10") int limit) {
        Map<String, Double> hotSeries = hotSeriesService.getTopHotSeriesWithScore(limit);
        return ResponseEntity.ok(ApiResponse.success(hotSeries));
    }
}
