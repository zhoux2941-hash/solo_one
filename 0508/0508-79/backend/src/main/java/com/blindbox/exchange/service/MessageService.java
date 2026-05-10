package com.blindbox.exchange.service;

import com.blindbox.exchange.dto.PageResponse;
import com.blindbox.exchange.entity.Message;
import com.blindbox.exchange.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;

    public List<Message> getUserMessages(Long userId) {
        return messageRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public PageResponse<Message> getUserMessagesPaginated(Long userId, int page, int size) {
        Page<Message> messages = messageRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size));
        return PageResponse.from(messages);
    }

    public long getUnreadCount(Long userId) {
        return messageRepository.countByUserIdAndIsReadFalse(userId);
    }

    public List<Message> getUnreadMessages(Long userId) {
        return messageRepository.findByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public Message markAsRead(Long userId, Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("消息不存在"));
        if (!message.getUser().getId().equals(userId)) {
            throw new RuntimeException("无权操作此消息");
        }
        message.setIsRead(true);
        return messageRepository.save(message);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Message> unread = messageRepository.findByUserIdAndIsReadFalse(userId);
        for (Message msg : unread) {
            msg.setIsRead(true);
        }
        messageRepository.saveAll(unread);
    }
}
