package com.blindbox.exchange.repository;

import com.blindbox.exchange.entity.Valuation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ValuationRepository extends JpaRepository<Valuation, Long> {
    
    Optional<Valuation> findByUserIdAndBoxId(Long userId, Long boxId);
    
    List<Valuation> findByBoxId(Long boxId);
    
    @Query("SELECT COUNT(v) FROM Valuation v WHERE v.box.id = :boxId")
    long countByBoxId(@Param("boxId") Long boxId);
    
    @Query("SELECT AVG(v.price) FROM Valuation v WHERE v.box.id = :boxId")
    BigDecimal findAveragePriceByBoxId(@Param("boxId") Long boxId);
    
    @Query("SELECT AVG(v.price) FROM Valuation v WHERE v.box.seriesName = :seriesName AND v.box.styleName = :styleName")
    BigDecimal findAveragePriceBySeriesAndStyle(
            @Param("seriesName") String seriesName,
            @Param("styleName") String styleName);
    
    @Query("SELECT COUNT(v) FROM Valuation v WHERE v.box.seriesName = :seriesName AND v.box.styleName = :styleName")
    long countBySeriesAndStyle(
            @Param("seriesName") String seriesName,
            @Param("styleName") String styleName);
}
