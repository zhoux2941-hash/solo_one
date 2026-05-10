package com.blindbox.exchange.service;

import com.blindbox.exchange.entity.BlindBox;
import com.blindbox.exchange.entity.ExchangeRequest;
import com.blindbox.exchange.entity.TransactionPrice;
import com.blindbox.exchange.repository.BlindBoxRepository;
import com.blindbox.exchange.repository.ExchangeRequestRepository;
import com.blindbox.exchange.repository.TransactionPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionPriceService {

    private final TransactionPriceRepository transactionPriceRepository;
    private final BlindBoxRepository blindBoxRepository;
    private final ExchangeRequestRepository exchangeRequestRepository;

    @Transactional
    public void recordTransaction(ExchangeRequest request, BigDecimal offerBoxPrice, BigDecimal requestBoxPrice) {
        if (transactionPriceRepository.existsByExchangeRequestId(request.getId())) {
            log.info("交换请求{}的成交价已记录，跳过", request.getId());
            return;
        }
        
        BlindBox offerBox = request.getOfferBox();
        BlindBox requestBox = request.getRequestBox();
        
        if (offerBoxPrice != null && offerBoxPrice.compareTo(BigDecimal.ZERO) > 0) {
            TransactionPrice tp1 = new TransactionPrice();
            tp1.setBox(offerBox);
            tp1.setSeriesName(offerBox.getSeriesName());
            tp1.setStyleName(offerBox.getStyleName());
            tp1.setPrice(offerBoxPrice);
            tp1.setTransactionDate(LocalDate.now());
            tp1.setExchangeRequest(request);
            transactionPriceRepository.save(tp1);
            log.info("记录盲盒{}成交价: {}", offerBox.getId(), offerBoxPrice);
        }
        
        if (requestBoxPrice != null && requestBoxPrice.compareTo(BigDecimal.ZERO) > 0) {
            TransactionPrice tp2 = new TransactionPrice();
            tp2.setBox(requestBox);
            tp2.setSeriesName(requestBox.getSeriesName());
            tp2.setStyleName(requestBox.getStyleName());
            tp2.setPrice(requestBoxPrice);
            tp2.setTransactionDate(LocalDate.now());
            tp2.setExchangeRequest(request);
            transactionPriceRepository.save(tp2);
            log.info("记录盲盒{}成交价: {}", requestBox.getId(), requestBoxPrice);
        }
    }

    public Map<String, Object> getTransactionStats(String seriesName, String styleName, int months) {
        LocalDate startDate = LocalDate.now().minusMonths(months);
        
        List<TransactionPrice> transactions = transactionPriceRepository
                .findBySeriesAndStyleAndDateAfter(seriesName, styleName, startDate);
        
        Map<String, Object> result = new HashMap<>();
        result.put("seriesName", seriesName);
        result.put("styleName", styleName);
        result.put("months", months);
        result.put("totalCount", transactions.size());
        
        List<Map<String, Object>> chartData = new ArrayList<>();
        Map<LocalDate, List<BigDecimal>> dailyPrices = new TreeMap<>();
        
        for (TransactionPrice tp : transactions) {
            dailyPrices.computeIfAbsent(tp.getTransactionDate(), k -> new ArrayList<>())
                    .add(tp.getPrice());
        }
        
        for (Map.Entry<LocalDate, List<BigDecimal>> entry : dailyPrices.entrySet()) {
            Map<String, Object> point = new HashMap<>();
            point.put("date", entry.getKey().toString());
            List<BigDecimal> prices = entry.getValue();
            BigDecimal avg = prices.stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(prices.size()), 2, BigDecimal.ROUND_HALF_UP);
            point.put("avgPrice", avg);
            point.put("count", prices.size());
            Collections.sort(prices);
            point.put("minPrice", prices.get(0));
            point.put("maxPrice", prices.get(prices.size() - 1));
            chartData.add(point);
        }
        
        result.put("chartData", chartData);
        
        if (!transactions.isEmpty()) {
            BigDecimal avg = transactionPriceRepository.findAveragePriceBySeriesAndStyleAndDateAfter(
                    seriesName, styleName, startDate);
            result.put("averagePrice", avg);
            
            List<BigDecimal> allPrices = new ArrayList<>();
            for (TransactionPrice tp : transactions) {
                allPrices.add(tp.getPrice());
            }
            Collections.sort(allPrices);
            result.put("minPrice", allPrices.get(0));
            result.put("maxPrice", allPrices.get(allPrices.size() - 1));
        }
        
        return result;
    }

    public List<Map<String, Object>> getRecentTransactions(String seriesName, String styleName, int limit) {
        List<TransactionPrice> transactions = transactionPriceRepository
                .findBySeriesNameAndStyleNameOrderByTransactionDateDesc(seriesName, styleName);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < Math.min(limit, transactions.size()); i++) {
            TransactionPrice tp = transactions.get(i);
            Map<String, Object> item = new HashMap<>();
            item.put("id", tp.getId());
            item.put("price", tp.getPrice());
            item.put("transactionDate", tp.getTransactionDate().toString());
            item.put("boxId", tp.getBox().getId());
            result.add(item);
        }
        return result;
    }
}
