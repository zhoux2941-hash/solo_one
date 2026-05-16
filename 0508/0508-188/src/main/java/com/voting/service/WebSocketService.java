package com.voting.service;

import com.voting.entity.Poll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void broadcastPollUpdate(Poll poll) {
        messagingTemplate.convertAndSend("/topic/poll/" + poll.getId(), poll);
    }
}
