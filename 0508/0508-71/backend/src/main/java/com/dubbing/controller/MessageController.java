package com.dubbing.controller;

import com.dubbing.common.Result;
import com.dubbing.entity.Message;
import com.dubbing.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/message")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @GetMapping("/my")
    public Result<List<Message>> getMyMessages() {
        List<Message> messages = messageService.getMyMessages();
        return Result.success(messages);
    }

    @GetMapping("/unread-count")
    public Result<Map<String, Long>> getUnreadCount() {
        Long count = messageService.getUnreadCount();
        Map<String, Long> result = new HashMap<>();
        result.put("count", count);
        return Result.success(result);
    }

    @PostMapping("/read/{messageId}")
    public Result<Void> markAsRead(@PathVariable Long messageId) {
        messageService.markAsRead(messageId);
        return Result.success();
    }

    @PostMapping("/read-all")
    public Result<Void> markAllAsRead() {
        messageService.markAllAsRead();
        return Result.success();
    }
}
