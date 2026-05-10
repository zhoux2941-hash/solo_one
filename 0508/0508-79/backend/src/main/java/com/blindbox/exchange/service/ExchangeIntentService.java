package com.blindbox.exchange.service;

import com.blindbox.exchange.dto.ExchangeIntentRequest;
import com.blindbox.exchange.dto.PageResponse;
import com.blindbox.exchange.entity.BlindBox;
import com.blindbox.exchange.entity.ExchangeIntent;
import com.blindbox.exchange.entity.User;
import com.blindbox.exchange.repository.BlindBoxRepository;
import com.blindbox.exchange.repository.ExchangeIntentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExchangeIntentService {

    private final ExchangeIntentRepository exchangeIntentRepository;
    private final BlindBoxRepository blindBoxRepository;
    private final MatchingService matchingService;

    @Transactional
    public ExchangeIntent createIntent(User user, ExchangeIntentRequest request) {
        BlindBox offerBox = blindBoxRepository.findById(request.getOfferBoxId())
                .orElseThrow(() -> new RuntimeException("盲盒不存在"));
        if (!offerBox.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("只能用自己的盲盒创建交换意向");
        }
        if (!offerBox.getIsAvailable()) {
            throw new RuntimeException("该盲盒不可用");
        }
        ExchangeIntent intent = new ExchangeIntent();
        intent.setUser(user);
        intent.setOfferBox(offerBox);
        intent.setDesiredSeries(request.getDesiredSeries());
        intent.setDesiredStyle(request.getDesiredStyle());
        intent.setNote(request.getNote());
        intent.setStatus("ACTIVE");
        ExchangeIntent saved = exchangeIntentRepository.save(intent);
        matchingService.checkAndCreateMatch(saved);
        return saved;
    }

    @Transactional
    public ExchangeIntent cancelIntent(Long userId, Long intentId) {
        ExchangeIntent intent = exchangeIntentRepository.findById(intentId)
                .orElseThrow(() -> new RuntimeException("交换意向不存在"));
        if (!intent.getUser().getId().equals(userId)) {
            throw new RuntimeException("无权操作此交换意向");
        }
        intent.setStatus("CANCELLED");
        return exchangeIntentRepository.save(intent);
    }

    public List<ExchangeIntent> getUserIntents(Long userId) {
        return exchangeIntentRepository.findByUserId(userId);
    }

    public List<ExchangeIntent> getUserActiveIntents(Long userId) {
        return exchangeIntentRepository.findByUserIdAndStatus(userId, "ACTIVE");
    }

    public PageResponse<ExchangeIntent> getUserIntentsPaginated(Long userId, int page, int size) {
        Page<ExchangeIntent> intents = exchangeIntentRepository.findByUserId(
                userId, PageRequest.of(page, size));
        return PageResponse.from(intents);
    }

    public ExchangeIntent getIntentById(Long intentId) {
        return exchangeIntentRepository.findById(intentId)
                .orElseThrow(() -> new RuntimeException("交换意向不存在"));
    }
}
