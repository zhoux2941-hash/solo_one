package com.blindbox.exchange.repository;

import com.blindbox.exchange.entity.BlindBox;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BlindBoxRepository extends JpaRepository<BlindBox, Long> {
    List<BlindBox> findByUserId(Long userId);
    List<BlindBox> findByUserIdAndIsAvailable(Long userId, Boolean isAvailable);
    
    @Query("SELECT b FROM BlindBox b WHERE b.isAvailable = true " +
           "AND (:seriesName IS NULL OR b.seriesName LIKE %:seriesName%) " +
           "AND (:styleName IS NULL OR b.styleName LIKE %:styleName%) " +
           "AND (:userId IS NULL OR b.user.id != :userId)")
    Page<BlindBox> searchAvailableBoxes(
            @Param("seriesName") String seriesName,
            @Param("styleName") String styleName,
            @Param("userId") Long userId,
            Pageable pageable);
    
    @Query("SELECT DISTINCT b.seriesName FROM BlindBox b WHERE b.isAvailable = true")
    List<String> findAllAvailableSeries();
    
    @Query("SELECT b FROM BlindBox b WHERE b.user.id != :userId AND b.isAvailable = true")
    Page<BlindBox> findAllAvailableForUser(@Param("userId") Long userId, Pageable pageable);
}
