package com.cinema.repository;

import com.cinema.entity.Exchange;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExchangeRepository extends JpaRepository<Exchange, Long> {
    List<Exchange> findByMemberId(Long memberId);
    
    @Query("SELECT e.snack.id, e.snack.name, COUNT(e), SUM(e.pointsUsed) FROM Exchange e GROUP BY e.snack.id, e.snack.name ORDER BY COUNT(e) DESC")
    List<Object[]> findSnackExchangeRanking();
}