package com.carpool.controller;

import com.carpool.dto.RequestDTO;
import com.carpool.service.CarpoolRequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "*")
public class RequestController {

    private final CarpoolRequestService requestService;

    public RequestController(CarpoolRequestService requestService) {
        this.requestService = requestService;
    }

    @PostMapping("/trip/{tripId}")
    public ResponseEntity<?> createRequest(
            @PathVariable Long tripId,
            @RequestBody(required = false) RequestDTO.CreateRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            if (request == null) {
                request = new RequestDTO.CreateRequest();
            }
            RequestDTO.RequestResponse response = requestService.createRequest(userId, tripId, request);
            return ResponseEntity.ok(success(response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMyRequests(HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            List<RequestDTO.RequestResponse> requests = requestService.getMyRequests(userId);
            return ResponseEntity.ok(success(requests));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @GetMapping("/received")
    public ResponseEntity<?> getReceivedRequests(HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            List<RequestDTO.RequestResponse> requests = requestService.getRequestsForMyTrips(userId);
            return ResponseEntity.ok(success(requests));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @PostMapping("/{requestId}/respond")
    public ResponseEntity<?> respondToRequest(
            @PathVariable Long requestId,
            @RequestBody RequestDTO.RespondRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            RequestDTO.RequestResponse response = requestService.respondToRequest(
                userId, requestId, request.getAction());
            return ResponseEntity.ok(success(response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    private Map<String, Object> success(Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", data);
        return result;
    }

    private Map<String, Object> error(String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", message);
        return result;
    }
}
