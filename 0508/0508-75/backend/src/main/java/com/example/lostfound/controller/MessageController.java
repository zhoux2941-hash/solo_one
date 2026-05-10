package com.example.lostfound.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.example.lostfound.common.Result;
import com.example.lostfound.entity.Message;
import com.example.lostfound.entity.User;
import com.example.lostfound.mapper.MessageMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.List;

@RestController
@RequestMapping("/api/message")
@RequiredArgsConstructor
public class MessageController {

    private final MessageMapper messageMapper;

    @GetMapping
    public Result<List<Message>> myMessages(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return Result.error(401, "请先登录");
        }
        List<Message> list = messageMapper.selectList(
            new LambdaQueryWrapper<Message>()
                .eq(Message::getReceiverId, user.getId())
                .orderByDesc(Message::getCreateTime)
        );
        return Result.success(list);
    }

    @GetMapping("/unread-count")
    public Result<Long> unreadCount(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return Result.success(0L);
        }
        Long count = messageMapper.selectCount(
            new LambdaQueryWrapper<Message>()
                .eq(Message::getReceiverId, user.getId())
                .eq(Message::getIsRead, 0)
        );
        return Result.success(count);
    }

    @PostMapping("/read/{id}")
    public Result<Void> markRead(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return Result.error(401, "请先登录");
        }
        Message msg = messageMapper.selectById(id);
        if (msg == null || !msg.getReceiverId().equals(user.getId())) {
            return Result.error("消息不存在或无权操作");
        }
        messageMapper.update(null,
            new LambdaUpdateWrapper<Message>()
                .eq(Message::getId, id)
                .set(Message::getIsRead, 1)
        );
        return Result.success();
    }
}
