package com.blindbox.exchange.repository;

import com.blindbox.exchange.entity.TransactionPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionPriceRepository extends JpaRepository<TransactionPrice, Long> {
    
    List<TransactionPrice> findByBoxIdOrderByTransactionDateDesc(Long boxId);
    
    List<TransactionPrice> findBySeriesNameAndStyleNameOrderByTransactionDateDesc(
            String seriesName, String styleName);
    
    @Query("SELECT t FROM TransactionPrice t WHERE t.seriesName = :seriesName " +
           "AND t.styleName = :styleName AND t.transactionDate >= :startDate " +
           "ORDER BY t.transactionDate ASC")
    List<TransactionPrice> findBySeriesAndStyleAndDateAfter(
            @Param("seriesName") String seriesName,
            @Param("styleName") String styleName,
            @Param("startDate") LocalDate startDate);
    
    @Query("SELECT AVG(t.price) FROM TransactionPrice t WHERE t.seriesName = :seriesName " +
           "AND t.styleName = :styleName AND t.transactionDate >= :startDate")
    BigDecimal findAveragePriceBySeriesAndStyleAndDateAfter(
            @Param("seriesName") String seriesName,
            @Param("styleName") String styleName,
            @Param("startDate") LocalDate startDate);
    
    boolean existsByExchangeRequestId(Long exchangeRequestId);
}
