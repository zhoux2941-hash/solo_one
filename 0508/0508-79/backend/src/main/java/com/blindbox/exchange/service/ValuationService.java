package com.blindbox.exchange.service;

import com.blindbox.exchange.entity.BlindBox;
import com.blindbox.exchange.entity.User;
import com.blindbox.exchange.entity.Valuation;
import com.blindbox.exchange.repository.BlindBoxRepository;
import com.blindbox.exchange.repository.ValuationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ValuationService {

    private final ValuationRepository valuationRepository;
    private final BlindBoxRepository blindBoxRepository;

    @Transactional
    public Valuation submitValuation(User user, Long boxId, BigDecimal price, String note) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("估价必须大于0");
        }
        
        BlindBox box = blindBoxRepository.findById(boxId)
                .orElseThrow(() -> new RuntimeException("盲盒不存在"));
        
        Optional<Valuation> existing = valuationRepository.findByUserIdAndBoxId(user.getId(), boxId);
        
        Valuation valuation;
        if (existing.isPresent()) {
            valuation = existing.get();
            valuation.setPrice(price);
            valuation.setNote(note);
            log.info("用户{}更新了盲盒{}的估价: {}", user.getUsername(), boxId, price);
        } else {
            valuation = new Valuation();
            valuation.setUser(user);
            valuation.setBox(box);
            valuation.setPrice(price);
            valuation.setNote(note);
            log.info("用户{}对盲盒{}进行了估价: {}", user.getUsername(), boxId, price);
        }
        
        return valuationRepository.save(valuation);
    }

    public Optional<Valuation> getUserValuation(Long userId, Long boxId) {
        return valuationRepository.findByUserIdAndBoxId(userId, boxId);
    }

    public Map<String, Object> getBoxValuationStats(Long boxId) {
        BlindBox box = blindBoxRepository.findById(boxId)
                .orElseThrow(() -> new RuntimeException("盲盒不存在"));
        
        Map<String, Object> stats = new HashMap<>();
        
        long count = valuationRepository.countByBoxId(boxId);
        BigDecimal avgPrice = valuationRepository.findAveragePriceByBoxId(boxId);
        
        stats.put("boxId", boxId);
        stats.put("count", count);
        stats.put("averagePrice", avgPrice);
        
        long seriesCount = valuationRepository.countBySeriesAndStyle(
                box.getSeriesName(), box.getStyleName());
        BigDecimal seriesAvg = valuationRepository.findAveragePriceBySeriesAndStyle(
                box.getSeriesName(), box.getStyleName());
        
        stats.put("seriesName", box.getSeriesName());
        stats.put("styleName", box.getStyleName());
        stats.put("seriesCount", seriesCount);
        stats.put("seriesAveragePrice", seriesAvg);
        
        return stats;
    }

    public Map<String, Object> getSeriesValuationStats(String seriesName, String styleName) {
        Map<String, Object> stats = new HashMap<>();
        
        long count = valuationRepository.countBySeriesAndStyle(seriesName, styleName);
        BigDecimal avgPrice = valuationRepository.findAveragePriceBySeriesAndStyle(seriesName, styleName);
        
        stats.put("seriesName", seriesName);
        stats.put("styleName", styleName);
        stats.put("count", count);
        stats.put("averagePrice", avgPrice);
        
        return stats;
    }
}
