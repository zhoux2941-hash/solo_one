package com.blindbox.exchange.service;

import com.blindbox.exchange.dto.AcceptExchangeRequest;
import com.blindbox.exchange.dto.ExchangeRequestDTO;
import com.blindbox.exchange.dto.PageResponse;
import com.blindbox.exchange.entity.BlindBox;
import com.blindbox.exchange.entity.ExchangeRequest;
import com.blindbox.exchange.entity.Message;
import com.blindbox.exchange.entity.User;
import com.blindbox.exchange.entity.ExchangeIntent;
import com.blindbox.exchange.repository.BlindBoxRepository;
import com.blindbox.exchange.repository.ExchangeIntentRepository;
import com.blindbox.exchange.repository.ExchangeRequestRepository;
import com.blindbox.exchange.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExchangeRequestService {

    private final ExchangeRequestRepository exchangeRequestRepository;
    private final BlindBoxRepository blindBoxRepository;
    private final ExchangeIntentRepository exchangeIntentRepository;
    private final MessageRepository messageRepository;
    private final TransactionPriceService transactionPriceService;

    @Transactional
    public ExchangeRequest createRequest(User fromUser, ExchangeRequestDTO request) {
        BlindBox offerBox = blindBoxRepository.findById(request.getOfferBoxId())
                .orElseThrow(() -> new RuntimeException("你提供的盲盒不存在"));
        BlindBox requestBox = blindBoxRepository.findById(request.getRequestBoxId())
                .orElseThrow(() -> new RuntimeException("请求的盲盒不存在"));
        
        if (!offerBox.getUser().getId().equals(fromUser.getId())) {
            throw new RuntimeException("只能用自己的盲盒发起请求");
        }
        if (!offerBox.getIsAvailable() || !requestBox.getIsAvailable()) {
            throw new RuntimeException("盲盒不可用于交换");
        }
        if (requestBox.getUser().getId().equals(fromUser.getId())) {
            throw new RuntimeException("不能向自己发起交换请求");
        }
        
        ExchangeRequest exchangeRequest = new ExchangeRequest();
        exchangeRequest.setFromUser(fromUser);
        exchangeRequest.setToUser(requestBox.getUser());
        exchangeRequest.setOfferBox(offerBox);
        exchangeRequest.setRequestBox(requestBox);
        exchangeRequest.setMessage(request.getMessage());
        exchangeRequest.setStatus("PENDING");
        
        ExchangeRequest saved = exchangeRequestRepository.save(exchangeRequest);
        
        sendRequestNotification(requestBox.getUser(), fromUser, saved);
        
        return saved;
    }

    private void sendRequestNotification(User toUser, User fromUser, ExchangeRequest request) {
        Message message = new Message();
        message.setUser(toUser);
        message.setTitle("收到新的交换请求");
        message.setContent("用户「" + fromUser.getNickname() + 
                "」想用「" + request.getOfferBox().getSeriesName() + "-" + request.getOfferBox().getStyleName() + 
                "」交换你的「" + request.getRequestBox().getSeriesName() + "-" + request.getRequestBox().getStyleName() + 
                "」，快去处理吧！");
        message.setType("REQUEST");
        message.setRelatedId(request.getId());
        messageRepository.save(message);
    }

    @Transactional
    public ExchangeRequest acceptRequest(Long userId, Long requestId) {
        return acceptRequestWithPrice(userId, requestId, null, null);
    }
    
    @Transactional
    public ExchangeRequest acceptRequestWithPrice(Long userId, Long requestId, 
            BigDecimal myBoxPrice, BigDecimal otherBoxPrice) {
        ExchangeRequest request = exchangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("交换请求不存在"));
        if (!request.getToUser().getId().equals(userId)) {
            throw new RuntimeException("无权处理此请求");
        }
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("请求已处理");
        }
        
        BlindBox offerBox = request.getOfferBox();
        BlindBox requestBox = request.getRequestBox();
        
        if (!offerBox.getIsAvailable() || !requestBox.getIsAvailable()) {
            throw new RuntimeException("盲盒已不可用");
        }
        
        offerBox.setIsAvailable(false);
        requestBox.setIsAvailable(false);
        blindBoxRepository.save(offerBox);
        blindBoxRepository.save(requestBox);
        
        request.setStatus("COMPLETED");
        ExchangeRequest saved = exchangeRequestRepository.save(request);
        
        transactionPriceService.recordTransaction(saved, otherBoxPrice, myBoxPrice);
        
        closeRelatedIntents(request.getFromUser().getId(), offerBox.getId());
        closeRelatedIntents(userId, requestBox.getId());
        
        sendAcceptedNotification(request.getFromUser(), request);
        
        return saved;
    }
    
    private void closeRelatedIntents(Long userId, Long boxId) {
        List<ExchangeIntent> intents = exchangeIntentRepository.findActiveIntentsByUserAndBox(userId, boxId);
        for (ExchangeIntent intent : intents) {
            intent.setStatus("COMPLETED");
            exchangeIntentRepository.save(intent);
        }
    }

    @Transactional
    public ExchangeRequest rejectRequest(Long userId, Long requestId) {
        ExchangeRequest request = exchangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("交换请求不存在"));
        if (!request.getToUser().getId().equals(userId)) {
            throw new RuntimeException("无权处理此请求");
        }
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("请求已处理");
        }
        request.setStatus("REJECTED");
        ExchangeRequest saved = exchangeRequestRepository.save(request);
        
        sendRejectedNotification(request.getFromUser(), request);
        
        return saved;
    }

    @Transactional
    public ExchangeRequest cancelRequest(Long userId, Long requestId) {
        ExchangeRequest request = exchangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("交换请求不存在"));
        if (!request.getFromUser().getId().equals(userId)) {
            throw new RuntimeException("无权取消此请求");
        }
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("请求已处理，无法取消");
        }
        request.setStatus("CANCELLED");
        return exchangeRequestRepository.save(request);
    }

    private void sendAcceptedNotification(User toUser, ExchangeRequest request) {
        Message message = new Message();
        message.setUser(toUser);
        message.setTitle("交换请求已被接受！");
        message.setContent("您向用户「" + request.getToUser().getNickname() + 
                "」发起的交换请求已被接受，交换成功完成！");
        message.setType("SYSTEM");
        message.setRelatedId(request.getId());
        messageRepository.save(message);
    }

    private void sendRejectedNotification(User toUser, ExchangeRequest request) {
        Message message = new Message();
        message.setUser(toUser);
        message.setTitle("交换请求已被拒绝");
        message.setContent("您向用户「" + request.getToUser().getNickname() + 
                "」发起的交换请求已被拒绝。");
        message.setType("SYSTEM");
        message.setRelatedId(request.getId());
        messageRepository.save(message);
    }

    public List<ExchangeRequest> getUserRequests(Long userId) {
        return exchangeRequestRepository.findByUserId(userId);
    }

    public PageResponse<ExchangeRequest> getUserRequestsPaginated(Long userId, int page, int size) {
        Page<ExchangeRequest> requests = exchangeRequestRepository.findByUserId(
                userId, PageRequest.of(page, size));
        return PageResponse.from(requests);
    }

    public List<ExchangeRequest> getPendingRequests(Long userId) {
        return exchangeRequestRepository.findPendingRequests(userId, "PENDING");
    }

    public ExchangeRequest getRequestById(Long requestId) {
        return exchangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("交换请求不存在"));
    }
}
