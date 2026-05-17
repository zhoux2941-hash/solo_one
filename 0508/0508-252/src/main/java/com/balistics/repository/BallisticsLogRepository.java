package com.balistics.repository;

import com.balistics.entity.BallisticsLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BallisticsLogRepository extends JpaRepository<BallisticsLog, Long> {
    List<BallisticsLog> findByLogTypeOrderByCreateTimeDesc(String logType);
    List<BallisticsLog> findAllByOrderByCreateTimeDesc();
    List<BallisticsLog> findTop10ByOrderByCreateTimeDesc();
    List<BallisticsLog> findAllByOrderByCreateTimeDesc(Pageable pageable);
}
