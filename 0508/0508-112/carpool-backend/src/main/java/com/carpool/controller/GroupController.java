package com.carpool.controller;

import com.carpool.dto.MessageDTO;
import com.carpool.service.CarpoolGroupService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "*")
public class GroupController {

    private final CarpoolGroupService groupService;

    public GroupController(CarpoolGroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping
    public ResponseEntity<?> getMyGroups(HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            List<MessageDTO.GroupResponse> groups = groupService.getMyGroups(userId);
            return ResponseEntity.ok(success(groups));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<?> getGroupDetail(
            @PathVariable Long groupId,
            HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            MessageDTO.GroupResponse group = groupService.getGroupById(userId, groupId);
            return ResponseEntity.ok(success(group));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @GetMapping("/{groupId}/messages")
    public ResponseEntity<?> getGroupMessages(
            @PathVariable Long groupId,
            HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            List<MessageDTO.MessageResponse> messages = groupService.getGroupMessages(userId, groupId);
            return ResponseEntity.ok(success(messages));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/messages")
    public ResponseEntity<?> sendMessage(
            @PathVariable Long groupId,
            @Valid @RequestBody MessageDTO.SendMessage request,
            HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            MessageDTO.MessageResponse message = groupService.sendMessage(userId, groupId, request);
            return ResponseEntity.ok(success(message));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/complete")
    public ResponseEntity<?> completeTrip(
            @PathVariable Long groupId,
            HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            groupService.completeTrip(userId, groupId);
            return ResponseEntity.ok(success("行程完成，所有成员守信指数+5"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/cancel/{cancelUserId}")
    public ResponseEntity<?> cancelTrip(
            @PathVariable Long groupId,
            @PathVariable Long cancelUserId,
            HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            groupService.cancelTrip(userId, groupId, cancelUserId);
            return ResponseEntity.ok(success("已取消，守信指数-10"));
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
