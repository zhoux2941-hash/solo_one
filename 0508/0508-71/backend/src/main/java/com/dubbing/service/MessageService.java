package com.dubbing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.dubbing.entity.Message;
import com.dubbing.entity.User;
import com.dubbing.mapper.MessageMapper;
import com.dubbing.util.UserContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class MessageService {

    @Autowired
    private MessageMapper messageMapper;

    public List<Message> getMyMessages() {
        User currentUser = UserContext.getCurrentUser();
        return messageMapper.selectList(new LambdaQueryWrapper<Message>()
                .eq(Message::getUserId, currentUser.getId())
                .orderByDesc(Message::getCreateTime));
    }

    public Long getUnreadCount() {
        User currentUser = UserContext.getCurrentUser();
        return messageMapper.selectCount(new LambdaQueryWrapper<Message>()
                .eq(Message::getUserId, currentUser.getId())
                .eq(Message::getIsRead, 0));
    }

    @Transactional(rollbackFor = Exception.class)
    public void markAsRead(Long messageId) {
        User currentUser = UserContext.getCurrentUser();
        Message message = messageMapper.selectById(messageId);
        if (message == null || !message.getUserId().equals(currentUser.getId())) {
            throw new RuntimeException("消息不存在");
        }
        if (message.getIsRead() == 1) {
            return;
        }
        message.setIsRead(1);
        messageMapper.updateById(message);
    }

    @Transactional(rollbackFor = Exception.class)
    public void markAllAsRead() {
        User currentUser = UserContext.getCurrentUser();
        messageMapper.update(null, new LambdaUpdateWrapper<Message>()
                .eq(Message::getUserId, currentUser.getId())
                .eq(Message::getIsRead, 0)
                .set(Message::getIsRead, 1));
    }
}
