package com.voting.repository;

import com.voting.entity.VoteRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoteRecordRepository extends JpaRepository<VoteRecord, Long> {
    
    boolean existsByPollIdAndIpAddressAndNickname(Long pollId, String ipAddress, String nickname);
    
    List<VoteRecord> findByPollIdAndIpAddressAndNickname(Long pollId, String ipAddress, String nickname);
}
