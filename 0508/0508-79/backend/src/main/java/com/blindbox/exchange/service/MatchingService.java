package com.blindbox.exchange.service;

import com.blindbox.exchange.entity.ExchangeIntent;
import com.blindbox.exchange.entity.Match;
import com.blindbox.exchange.entity.Message;
import com.blindbox.exchange.repository.ExchangeIntentRepository;
import com.blindbox.exchange.repository.MatchRepository;
import com.blindbox.exchange.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchingService {

    private final ExchangeIntentRepository exchangeIntentRepository;
    private final MatchRepository matchRepository;
    private final MessageRepository messageRepository;

    @Transactional
    public void checkAndCreateMatch(ExchangeIntent newIntent) {
        log.info("检查交换意向匹配: 用户={}, 提供={}, 期望={}", 
                newIntent.getUser().getUsername(),
                newIntent.getOfferBox().getSeriesName(),
                newIntent.getDesiredSeries());
        
        List<ExchangeIntent> potentialMatches = exchangeIntentRepository.findMatchingIntents(
                newIntent.getUser().getId(),
                newIntent.getOfferBox().getSeriesName(),
                newIntent.getDesiredSeries()
        );
        
        for (ExchangeIntent existing : potentialMatches) {
            if (isTwoWayMatch(newIntent, existing)) {
                if (!matchRepository.existsByIntents(newIntent.getId(), existing.getId())) {
                    createMatch(newIntent, existing);
                }
            }
        }
    }

    private boolean isTwoWayMatch(ExchangeIntent intentA, ExchangeIntent intentB) {
        if (!"ACTIVE".equals(intentA.getStatus()) || !"ACTIVE".equals(intentB.getStatus())) {
            return false;
        }
        if (!intentA.getOfferBox().getIsAvailable() || !intentB.getOfferBox().getIsAvailable()) {
            return false;
        }
        
        String aOffer = intentA.getOfferBox().getSeriesName();
        String aDesired = intentA.getDesiredSeries();
        String bOffer = intentB.getOfferBox().getSeriesName();
        String bDesired = intentB.getDesiredSeries();
        
        boolean match1 = seriesMatches(aOffer, bDesired);
        boolean match2 = seriesMatches(bOffer, aDesired);
        
        return match1 && match2;
    }

    private boolean seriesMatches(String offerSeries, String desiredSeries) {
        if (offerSeries == null || desiredSeries == null) return false;
        return offerSeries.toLowerCase().contains(desiredSeries.toLowerCase()) ||
               desiredSeries.toLowerCase().contains(offerSeries.toLowerCase());
    }

    @Transactional
    public Match createMatch(ExchangeIntent intentA, ExchangeIntent intentB) {
        Match match = new Match();
        match.setIntentA(intentA);
        match.setIntentB(intentB);
        match.setStatus("PENDING");
        Match saved = matchRepository.save(match);
        
        sendMatchNotification(intentA, intentB, saved.getId());
        sendMatchNotification(intentB, intentA, saved.getId());
        
        log.info("创建匹配成功: MatchId={}, 用户A={}, 用户B={}", 
                saved.getId(), 
                intentA.getUser().getUsername(), 
                intentB.getUser().getUsername());
        
        return saved;
    }

    private void sendMatchNotification(ExchangeIntent myIntent, ExchangeIntent otherIntent, Long matchId) {
        Message message = new Message();
        message.setUser(myIntent.getUser());
        message.setTitle("找到匹配的交换意向！");
        message.setContent("您发布的「" + myIntent.getOfferBox().getSeriesName() + "-" + myIntent.getOfferBox().getStyleName() + 
                "」交换意向与用户「" + otherIntent.getUser().getNickname() + 
                "」的「" + otherIntent.getOfferBox().getSeriesName() + "-" + otherIntent.getOfferBox().getStyleName() + 
                "」成功匹配！快去查看详情吧。");
        message.setType("MATCH");
        message.setRelatedId(matchId);
        messageRepository.save(message);
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoMatchAllIntents() {
        log.info("开始定时匹配检查...");
        List<ExchangeIntent> activeIntents = exchangeIntentRepository.findAll().stream()
                .filter(i -> "ACTIVE".equals(i.getStatus()))
                .toList();
        
        for (int i = 0; i < activeIntents.size(); i++) {
            for (int j = i + 1; j < activeIntents.size(); j++) {
                ExchangeIntent intentA = activeIntents.get(i);
                ExchangeIntent intentB = activeIntents.get(j);
                if (isTwoWayMatch(intentA, intentB)) {
                    if (!matchRepository.existsByIntents(intentA.getId(), intentB.getId())) {
                        createMatch(intentA, intentB);
                    }
                }
            }
        }
        log.info("定时匹配检查完成");
    }
}
