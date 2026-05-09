package com.restaurant.queue.controller;

import com.restaurant.queue.dto.QueueRequest;
import com.restaurant.queue.dto.QueueResponse;
import com.restaurant.queue.dto.WaitTimePrediction;
import com.restaurant.queue.service.QueueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/queue")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class QueueController {

    private final QueueService queueService;

    @PostMapping("/enqueue")
    public ResponseEntity<QueueResponse> enqueue(
            @Valid @RequestBody QueueRequest request,
            @RequestHeader(value = "X-Restaurant-Id", required = false) Long headerRestaurantId) {
        if (request.getRestaurantId() == null && headerRestaurantId != null) {
            request.setRestaurantId(headerRestaurantId);
        }
        return ResponseEntity.ok(queueService.enqueue(request));
    }

    @PostMapping("/call-next")
    public ResponseEntity<QueueResponse> callNext(
            @RequestHeader(value = "X-Restaurant-Id", required = false) Long restaurantId) {
        return ResponseEntity.ok(queueService.callNextQueue(restaurantId));
    }

    @PostMapping("/complete/{queueId}")
    public ResponseEntity<QueueResponse> complete(@PathVariable Long queueId) {
        return ResponseEntity.ok(queueService.completeQueue(queueId));
    }

    @PostMapping("/skip/{queueId}")
    public ResponseEntity<QueueResponse> skip(@PathVariable Long queueId) {
        return ResponseEntity.ok(queueService.skipQueue(queueId));
    }

    @GetMapping("/status/{queueId}")
    public ResponseEntity<QueueResponse> getStatus(@PathVariable Long queueId) {
        return ResponseEntity.ok(queueService.getQueueStatus(queueId));
    }

    @GetMapping("/active")
    public ResponseEntity<List<QueueResponse>> getActiveQueues(
            @RequestHeader(value = "X-Restaurant-Id", required = false) Long restaurantId) {
        return ResponseEntity.ok(queueService.getActiveQueues(restaurantId));
    }

    @GetMapping("/waiting")
    public ResponseEntity<List<QueueResponse>> getWaitingQueues(
            @RequestHeader(value = "X-Restaurant-Id", required = false) Long restaurantId) {
        return ResponseEntity.ok(queueService.getWaitingQueues(restaurantId));
    }

    @GetMapping("/predict")
    public ResponseEntity<WaitTimePrediction> predictWaitTime(
            @RequestParam(defaultValue = "2") Integer partySize,
            @RequestHeader(value = "X-Restaurant-Id", required = false) Long restaurantId,
            @RequestParam(value = "restaurantId", required = false) Long queryRestaurantId) {
        Long effectiveRestaurantId = queryRestaurantId != null ? queryRestaurantId : restaurantId;
        return ResponseEntity.ok(queueService.predictWaitTime(effectiveRestaurantId, partySize));
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        Map<String, Object> config = queueService.getTableConfig();
        return ResponseEntity.ok(config);
    }
}
