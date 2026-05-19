package com.community.buying.repository;

import com.community.buying.entity.GroupRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRecordRepository extends JpaRepository<GroupRecord, Long> {
    List<GroupRecord> findByGroupActivityId(Long groupActivityId);
    List<GroupRecord> findByUserId(Long userId);
    Optional<GroupRecord> findByOrderId(Long orderId);
}