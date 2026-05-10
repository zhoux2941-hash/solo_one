package com.company.grouporder.repository;

import com.company.grouporder.entity.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, Long> {
    List<Participant> findByGroupOrderIdOrderByJoinedAt(Long groupOrderId);
    Optional<Participant> findByGroupOrderIdAndUserId(Long groupOrderId, String userId);
    void deleteByGroupOrderId(Long groupOrderId);
}
