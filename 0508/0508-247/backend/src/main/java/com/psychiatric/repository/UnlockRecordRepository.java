package com.psychiatric.repository;

import com.psychiatric.entity.UnlockRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UnlockRecordRepository extends JpaRepository<UnlockRecord, Long> {
    List<UnlockRecord> findByWardNumberOrderByUnlockTimeDesc(String wardNumber);
}
